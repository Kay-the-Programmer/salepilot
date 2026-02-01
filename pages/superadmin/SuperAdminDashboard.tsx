import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import { RevenueSummary, StoreStats, User } from '../../types';

// Components
import WelcomeHero from '../../components/superadmin/dashboard/WelcomeHero';
import DashboardStatsGrid from '../../components/superadmin/dashboard/DashboardStatsGrid';
import DashboardRevenueChart from '../../components/superadmin/dashboard/DashboardRevenueChart';
import SuperAdminAiCard from '../../components/superadmin/dashboard/SuperAdminAiCard';
import HoloComputeHub from '../../components/superadmin/dashboard/HoloComputeHub';
import LiveRobot from '../../components/superadmin/dashboard/LiveRobot';

const SuperAdminDashboard: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [revSummary, setRevSummary] = useState<RevenueSummary | null>(null);
    const [storeStats, setStoreStats] = useState<StoreStats>({
        total: 0,
        active: 0,
        trial: 0,
        inactive: 0
    });
    const [aiInsight, setAiInsight] = useState<string>("Analyzing platform performance...");

    // ROBOT DUO STATE
    const [scoutState, setScoutState] = useState<{
        x: number | string;
        y: number | string;
        scale: number;
        isScanning: boolean;
        isCalling?: boolean;
        speech: string | null;
        mode: 'PATROL' | 'RETURN' | 'IDLE' | 'REPORT' | 'MAINTENANCE' | 'RESEARCH' | 'SCAN';
        mood: 'NORMAL' | 'HAPPY' | 'SCANNING' | 'THINKING' | 'WARNING' | 'ANGRY' | 'SURPRISED';
        isLanding?: boolean;
    }>({
        x: '85%',
        y: '80px',
        scale: 0.8,
        isScanning: false,
        isCalling: false,
        speech: null,
        mode: 'IDLE',
        mood: 'NORMAL'
    });

    const [commanderSpeech, setCommanderSpeech] = useState<string | null>(null);
    const [commanderMood, setCommanderMood] = useState<'NORMAL' | 'HAPPY' | 'THINKING' | 'WARNING' | 'ANGRY' | 'SURPRISED'>('NORMAL');
    const [commanderCalling, setCommanderCalling] = useState(false);
    const [showDataBeam, setShowDataBeam] = useState(false);
    const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
    const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);
    const [isResearching, setIsResearching] = useState(false);
    const [glitchCardId, setGlitchCardId] = useState<string | null>(null);
    const [isDraggingCommander, setIsDraggingCommander] = useState(false);
    const [isDraggingScout, setIsDraggingScout] = useState(false);
    const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());

    // --- HELPER FUNCTIONS (Defined before use) ---

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('en-ZM', {
            style: 'currency',
            currency: 'ZMW',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    function getScoutScreenPos() {
        const getNumeric = (val: string | number) => {
            if (typeof val === 'number') return val;
            if (typeof val !== 'string') return 0;
            if (val.includes('calc')) {
                if (val.includes('100%')) {
                    const pixels = parseInt(val.match(/\d+px/)?.[0] || '0');
                    return (typeof window !== 'undefined' ? window.innerWidth : 1920) - pixels;
                }
                return 500;
            }
            if (val.includes('%')) {
                return (parseFloat(val) / 100) * (typeof window !== 'undefined' ? window.innerWidth : 1920);
            }
            return parseFloat(val) || 0;
        };

        const currentX = getNumeric(scoutState.x);
        const currentY = getNumeric(scoutState.y);
        return { x: currentX, y: currentY };
    }

    function getRandomMetricComment() {
        if (!revSummary || !storeStats) return "Systems nominal.";

        const comments = [
            `Global revenue holding at ${formatCurrency(revSummary.totalAmount)}.`,
            `Active fleet: ${storeStats.active} stores operational.`,
            `Platform growth is within projected vectors.`,
            `Analyzing capital flow... ZMW liquidity is stable.`,
            `${storeStats.trial} new units in trial phase. Monitoring conversion.`
        ];
        return comments[Math.floor(Math.random() * comments.length)];
    }

    // REACHABILITY/PROXIMITY DETECTION
    useEffect(() => {
        const checkProximity = () => {
            const scoutPos = getScoutScreenPos();
            let nearestId = null;
            let minDistance = 150; // Threshold for proximity

            Object.entries(cardRefs.current).forEach(([id, ref]) => {
                if (ref) {
                    const rect = ref.getBoundingClientRect();
                    const cardX = rect.left + rect.width / 2;
                    const cardY = rect.top + rect.height / 2;
                    const dist = Math.hypot(scoutPos.x - (cardX - window.scrollX), scoutPos.y - (cardY - window.scrollY));

                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestId = id;
                    }
                }
            });

            setHighlightedCardId(nearestId);
        };

        const interval = setInterval(checkProximity, 100);
        return () => clearInterval(interval);
    }, [scoutState.x, scoutState.y]);

    // REPORT STATE
    const [isTypingReport, setIsTypingReport] = useState(false);
    const [reportText, setReportText] = useState("");

    const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const welcomeRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scoutRef = useRef<HTMLDivElement>(null);
    const refreshPlatformInsight = async () => {
        try {
            setAiInsight("Analyzing platform performance...");
            const response = await api.get<{ insight: string }>("/ai/platform-insight");
            setAiInsight(response.insight);
        } catch (err: any) {
            console.error("Failed to refresh insight", err);
            if (err.response?.status === 429) {
                setAiInsight("Daily AI quota reached. Standard platform metrics indicate stable performance across all regions.");
            } else {
                setAiInsight("Platform metrics are stable. Real-time analysis suggests a positive trend in global commerce engagement.");
            }
        }
    };

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

                // Default insight if not loaded
                setAiInsight("Platform intelligence is ready. Click the refresh icon to generate live strategic insights.");
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);


    // MOUSE TRACKING STATE FOR COMMANDER
    const mousePosRef = useRef({ x: typeof window !== 'undefined' ? window.innerWidth - 100 : 1800, y: 100 });
    const [commanderPos, setCommanderPos] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 100 : 1800, y: 100 });

    // Smooth follow logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mousePosRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('mousemove', handleMouseMove);

        let animationFrameId: number;

        const loop = () => {
            setCommanderPos(prev => {
                const targetX = mousePosRef.current.x - 70;
                const targetY = mousePosRef.current.y - 50;
                const newX = prev.x + (targetX - prev.x) * 0.05;
                const newY = prev.y + (targetY - prev.y) * 0.05;
                return { x: newX, y: newY };
            });
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // DRAGGING LOGIC
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingCommander) {
                mousePosRef.current = { x: e.clientX, y: e.clientY };
                setLastInteractionTime(Date.now());
            }
            if (isDraggingScout) {
                setScoutState(prev => ({
                    ...prev,
                    x: e.clientX - 40,
                    y: e.clientY - 40,
                    mode: 'IDLE',
                    mood: 'SURPRISED'
                }));
                setLastInteractionTime(Date.now());
            }
        };

        const handleMouseUp = () => {
            if (isDraggingCommander) {
                setIsDraggingCommander(false);
                setCommanderMood('HAPPY');
                setCommanderSpeech("Back in formation.");
                setTimeout(() => setCommanderSpeech(null), 2000);
            }
            if (isDraggingScout) {
                setIsDraggingScout(false);
                setScoutState(prev => ({ ...prev, mood: 'HAPPY', speech: "Area secured!" }));
                setTimeout(() => setScoutState(prev => ({ ...prev, speech: null })), 2000);
            }
        };

        if (isDraggingCommander || isDraggingScout) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingCommander, isDraggingScout]);


    // IDLE BEHAVIOR ENGINE
    useEffect(() => {
        if (loading || isDraggingCommander || isDraggingScout) return;

        const interval = setInterval(() => {
            const now = Date.now();
            if (now - lastInteractionTime < 5000) return; // Wait after interaction
            if (Math.random() > 0.7) {
                // Random Idle Action
                const action = Math.floor(Math.random() * 4);
                switch (action) {
                    case 0: // Commander comments
                        setCommanderMood('THINKING');
                        setCommanderSpeech(getRandomMetricComment());
                        setTimeout(() => {
                            setCommanderSpeech(null);
                            setCommanderMood('NORMAL');
                        }, 3000);
                        break;
                    case 1: // Scout investigates highlighted card
                        if (highlightedCardId) {
                            setScoutState(prev => ({ ...prev, mood: 'SCANNING', speech: "Scanning sector..." }));
                            setTimeout(() => setScoutState(prev => ({ ...prev, speech: null, mood: 'HAPPY' })), 3000);
                        }
                        break;
                    case 2: // Joint scan
                        setCommanderMood('SCANNING' as any); // Type cast if needed, but 'SCANNING' might match mood in CSS if added
                        setScoutState(prev => ({ ...prev, mood: 'SCANNING', speech: "Cross-referencing data..." }));
                        setTimeout(() => {
                            setCommanderMood('NORMAL');
                            setScoutState(prev => ({ ...prev, mood: 'NORMAL', speech: null }));
                        }, 4000);
                        break;
                    case 3: // Scout looks at Commander
                        setScoutState(prev => ({ ...prev, mood: 'HAPPY', speech: "Commander, awaiting orders." }));
                        setTimeout(() => setScoutState(prev => ({ ...prev, speech: null })), 2500);
                        break;
                }
            }
        }, 12000);

        return () => clearInterval(interval);
    }, [loading, isDraggingCommander, isDraggingScout, revSummary, storeStats, highlightedCardId, lastInteractionTime]);

    // ROBOT ORCHESTRATION
    const runPatrolMission = async () => {
        const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

        // 1. Commander Orders via Phone
        setCommanderMood('HAPPY');
        setCommanderSpeech("Unit Beta, move to the terminal for data uplink.");
        await wait(2500);
        setCommanderSpeech(null);

        // 2. Scout Acknowledges & Moves to HUB TABLE
        setScoutState(prev => ({ ...prev, speech: "Understood. Initiating terminal sequence.", mood: 'HAPPY' }));
        await wait(1500);
        setScoutState(prev => ({ ...prev, speech: null }));

        // MOVE TO HUB TABLE
        setScoutState(prev => ({
            ...prev,
            x: 'calc(100% - 310px)',
            y: 'calc(15% + 480px)',
            scale: 0.95,
            mode: 'RESEARCH'
        }));
        await wait(2000);

        setIsResearching(true);
        setIsTypingReport(true);
        setReportText("DECRYPTING_SECURE_PROTOCOLS...\nUPLINK: 88%\nLATENCY: 4ms");
        await wait(2000);
        setScoutState(prev => ({ ...prev, mood: 'HAPPY', speech: "Uplink Secure." }));
        setIsTypingReport(false);
        setReportText("");
        await wait(1500);
        setIsResearching(false);
        setScoutState(prev => ({ ...prev, speech: null, mode: 'IDLE' }));

        // DATA SYNC BEAM
        setScoutState(prev => ({ ...prev, x: '88%', y: '160px', mood: 'SCANNING' }));
        await wait(1500);
        setShowDataBeam(true);
        setCommanderMood('THINKING');
        await wait(3000);
        setShowDataBeam(false);
        setCommanderMood('HAPPY');
        setCommanderSpeech("Data received. Proceed.");
        setScoutState(prev => ({ ...prev, mood: 'HAPPY', speech: "Sync Complete." }));
        await wait(2000);
        setCommanderSpeech(null);
        setCommanderMood('NORMAL');

        // 3. SCAN LIVE CARDS
        const liveCards = ['revenue', 'active_stores'];
        for (const cardId of liveCards) {
            const card = cardRefs.current[cardId];
            if (card) {
                const rect = card.getBoundingClientRect();
                setScoutState(prev => ({
                    ...prev,
                    x: rect.left + window.scrollX + 20,
                    y: rect.top + window.scrollY - 80,
                    mode: 'SCAN',
                    isScanning: true,
                    mood: 'SCANNING'
                }));
                setFlippedCardId(cardId);
                await wait(2500);
                setFlippedCardId(null);
                setScoutState(prev => ({ ...prev, isScanning: false, mood: 'HAPPY' }));
                await wait(800);
            }
        }

        // 4. Commander Calling
        setCommanderMood('HAPPY');
        setCommanderSpeech("Excellent metrics.");
        setCommanderCalling(true);
        await wait(3000);
        setCommanderCalling(false);
        setCommanderSpeech(null);

        // 5. JOINT RESEARCH PHASE
        setScoutState(s => ({
            ...s,
            mode: 'RESEARCH',
            mood: 'THINKING',
            x: 'calc(100% - 250px)',
            y: 'calc(15% + 150px)',
            speech: "Deep scanning market trends..."
        }));
        await wait(2000);
        setIsResearching(true);
        setCommanderMood('THINKING');
        setCommanderSpeech("Analyzing satellite link...");
        setCommanderCalling(true);
        await wait(4000);
        setCommanderCalling(false);
        setCommanderSpeech(null);
        setCommanderMood('HAPPY');
        setScoutState(s => ({ ...s, mood: 'HAPPY', speech: "Optimization vectors mapped!" }));
        await wait(2000);
        setIsResearching(false);
        setScoutState(s => ({ ...s, speech: null, mode: 'IDLE' }));

        // 6. Return to Base
        setScoutState(prev => ({
            ...prev,
            x: '85%',
            y: '100px',
            scale: 0.8,
            mode: 'IDLE'
        }));
    };

    const runSecuritySweep = async () => {
        const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
        const cards = Object.keys(cardRefs.current);
        const targetCardId = cards[Math.floor(Math.random() * cards.length)];

        setGlitchCardId(targetCardId);
        setCommanderMood('WARNING');
        setCommanderSpeech("Anomalous activity detected in the data stream!");
        await wait(2000);

        setScoutState(prev => ({
            ...prev,
            mood: 'SCANNING',
            speech: "Intercepting glitch... move to intercept!"
        }));

        const cardRef = cardRefs.current[targetCardId];
        if (cardRef) {
            const rect = cardRef.getBoundingClientRect();
            setScoutState(prev => ({
                ...prev,
                x: rect.left + window.scrollX + 20,
                y: rect.top + window.scrollY - 80,
                mode: 'SCAN',
                isScanning: true
            }));
        }
        await wait(3000);

        setGlitchCardId(null);
        setScoutState(prev => ({ ...prev, mood: 'HAPPY', speech: "Glitch neutralized.", isScanning: false }));
        setCommanderSpeech("Excellent work, Unit Beta.");
        setCommanderMood('HAPPY');
        await wait(2000);
        setCommanderSpeech(null);
        setCommanderMood('NORMAL');
        setScoutState(prev => ({ ...prev, speech: null, mode: 'IDLE' }));
    };

    const triggerCelebration = async () => {
        const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
        setCommanderMood('HAPPY');
        setCommanderSpeech("Performance spikes detected! Initiating morale protocol.");

        // Dance sequence
        for (let i = 0; i < 3; i++) {
            setScoutState(prev => ({ ...prev, y: (getScoutScreenPos().y - 20), mood: 'HAPPY' }));
            await wait(300);
            setScoutState(prev => ({ ...prev, y: (getScoutScreenPos().y + 20) }));
            await wait(300);
        }

        setScoutState(prev => ({ ...prev, speech: "GO SALE PILOT! GO!", mood: 'HAPPY' }));
        await wait(2000);
        setCommanderSpeech(null);
        setScoutState(prev => ({ ...prev, speech: null }));
    };

    useEffect(() => {
        if (loading || isDraggingCommander || isDraggingScout) return;
        const interval = setInterval(() => {
            const rand = Math.random();
            if (rand > 0.8) runPatrolMission();
            else if (rand > 0.6) runSecuritySweep();
            else if (rand > 0.5 && (revSummary?.totalAmount || 0) > 0) triggerCelebration();
        }, 45000);
        return () => clearInterval(interval);
    }, [loading, isDraggingCommander, isDraggingScout, revSummary]);


    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 transition-colors duration-300 flex items-center justify-center">
                <div className="text-white font-mono animate-pulse">INIT_SALE_PILOT_OS...</div>
            </div>
        );
    }


    const scoutScreenPos = getScoutScreenPos();

    return (
        <div ref={containerRef} className="min-h-screen bg-slate-950 transition-colors duration-300 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200 relative">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 rounded-full blur-[120px]"></div>

                {/* DATA STREAM PARTICLES */}
                <div className="absolute inset-0 z-0">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-cyan-500/20 rounded-full animate-data-flow blur-[1px]"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDuration: `${3 + Math.random() * 7}s`,
                                animationDelay: `${Math.random() * 5}s`
                            }}
                        ></div>
                    ))}
                </div>
            </div>

            {/* --- ROBOT LAYER --- */}

            {/* ROBOT SHADOWS */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute w-24 h-8 bg-black/20 blur-xl rounded-full transition-transform duration-[50ms]"
                    style={{ transform: `translate3d(${commanderPos.x + 30}px, ${commanderPos.y + 150}px, 0) scaleX(1.5)` }}
                ></div>
                <div
                    className="absolute w-16 h-6 bg-black/20 blur-lg rounded-full transition-all duration-1000"
                    style={{ transform: `translate3d(${scoutScreenPos.x + 20}px, ${scoutScreenPos.y + 100}px, 0) scaleX(1.5)` }}
                ></div>
            </div>

            {/* DATA BEAM SVG */}
            {showDataBeam && !isNaN(scoutScreenPos.x) && !isNaN(commanderPos.x) && (
                <svg className="fixed inset-0 w-full h-full pointer-events-none z-[45]">
                    <defs>
                        <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
                            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                        </linearGradient>
                        <filter id="beamGlow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    <line
                        x1={(scoutScreenPos.x || 0) + 80}
                        y1={(scoutScreenPos.y || 0) + 80}
                        x2={(commanderPos.x || 0) + 70}
                        y2={(commanderPos.y || 0) + 70}
                        stroke="url(#beamGradient)"
                        strokeWidth="4"
                        strokeDasharray="10,5"
                        filter="url(#beamGlow)"
                        className="animate-beam-flow"
                    />
                </svg>
            )}

            {/* 1. Commander */}
            <LiveRobot
                variant="APPLE"
                speech={commanderSpeech}
                mood={commanderMood}
                isCalling={commanderCalling}
                isDragging={isDraggingCommander}
                onMouseDown={() => setIsDraggingCommander(true)}
                mode={isResearching ? 'RESEARCH' : 'IDLE'}
                className="fixed transition-all duration-300 z-50 scale-75 md:scale-100"
                style={{
                    left: `${commanderPos.x}px`,
                    top: `${commanderPos.y}px`
                }}
            />

            {/* 2. Scout */}
            <div
                ref={scoutRef}
                className="fixed z-[49] pointer-events-none transition-all duration-1000 ease-in-out"
                style={{
                    left: scoutState.x,
                    top: scoutState.y,
                    transform: `scale(${typeof scoutState.x === 'number' ? scoutState.scale * 0.7 : scoutState.scale})`, // Smaller on mobile if dynamic pos
                }}
            >
                <LiveRobot
                    variant="ANDROID"
                    isScanning={scoutState.isScanning}
                    isCalling={scoutState.isCalling}
                    speech={scoutState.speech}
                    mood={scoutState.mood}
                    isLanding={scoutState.isLanding}
                    isDragging={isDraggingScout}
                    targetPos={showDataBeam ? { x: commanderPos.x + 70, y: commanderPos.y + 70 } : null}
                    className={`drop-shadow-2xl md:scale-100 scale-75 ${scoutState.mode === 'MAINTENANCE' ? 'animate-scrub' : ''}`}
                    onClick={() => {
                        setScoutState(prev => ({ ...prev, mood: 'HAPPY', speech: "Systems 100% operational!" }));
                        setLastInteractionTime(Date.now());
                        setTimeout(() => setScoutState(prev => ({ ...prev, speech: null })), 2000);
                    }}
                    onMouseDown={() => {
                        setIsDraggingScout(true);
                        setScoutState(prev => ({ ...prev, mode: 'IDLE' }));
                    }}
                />
            </div>

            {/* MOBILE TECH ACCENT (Simplified Hub) */}
            <div className="lg:hidden fixed top-[10%] left-0 w-full pointer-events-none z-0 opacity-40 overflow-hidden h-40">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[80px]"></div>
                <div className="absolute top-10 left-[10%] w-32 h-32 border border-indigo-500/20 rounded-full animate-ping [animation-duration:4s]"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 z-10">
                {/* Hero Section */}
                <div ref={welcomeRef} className="relative">
                    <WelcomeHero
                        userName="Super Admin"
                        stats={{
                            totalRevenue: formatCurrency(revSummary?.totalAmount || 0),
                            activeStores: storeStats.active
                        }}
                        isTypingReport={isTypingReport}
                        reportText={reportText}
                        description={aiInsight}
                        onRefreshInsight={refreshPlatformInsight}
                    />
                    <HoloComputeHub isSyncing={showDataBeam} isResearching={isResearching} />
                </div>

                {/* Stats Grid */}
                <DashboardStatsGrid
                    revSummary={revSummary}
                    storeStats={storeStats}
                    formatCurrency={formatCurrency}
                    cardRefs={cardRefs}
                    flippedCardId={flippedCardId}
                    highlightedCardId={highlightedCardId}
                    glitchCardId={glitchCardId}
                    className={glitchCardId ? 'animate-pulse' : ''}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32">
                    <div className="lg:col-span-3">
                        <DashboardRevenueChart
                            revSummary={revSummary}
                            formatCurrency={formatCurrency}
                        />
                    </div>
                </div>
            </div>

            {/* Dashboard AI Card FAB (Optimized for Mobile) */}
            <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[51]">
                {/* Visual Connector to Floating Deck (Mobile) */}
                <div className="md:hidden absolute bottom-[-10px] right-1/2 translate-x-1/2 w-1 h-10 bg-gradient-to-t from-indigo-500/40 to-transparent"></div>
                <SuperAdminAiCard
                    userName={currentUser?.name || 'Commander'}
                    platformStats={{
                        totalStores: storeStats.total,
                        activeStores: storeStats.active,
                        totalRevenue: revSummary?.totalAmount || 0
                    }}
                />
            </div>

            <style>{`
                @keyframes data-flow {
                    0% { transform: translateY(100vh) scale(0); opacity: 0; }
                    20% { opacity: 0.5; }
                    80% { opacity: 0.5; }
                    100% { transform: translateY(-100px) scale(1); opacity: 0; }
                }
                .animate-data-flow { animation: data-flow linear infinite; }
                @keyframes beam-flow {
                    0% { stroke-dashoffset: 100; opacity: 0.3; }
                    50% { opacity: 1; }
                    100% { stroke-dashoffset: 0; opacity: 0.3; }
                }
                .animate-beam-flow { animation: beam-flow 1s linear infinite; }
                @keyframes scrub {
                    0%, 100% { transform: rotate(0deg) translateX(0); }
                    25% { transform: rotate(5deg) translateX(10px); }
                    75% { transform: rotate(-5deg) translateX(-10px); }
                }
                .animate-scrub { animation: scrub 0.5s ease-in-out infinite; }
                
                @keyframes glitch-shake {
                    0%, 100% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                }
                .glitch-card {
                    animation: glitch-shake 0.2s linear infinite;
                    filter: hue-rotate(90deg) contrast(1.5);
                }
            `}</style>
        </div >
    );
};

export default SuperAdminDashboard;