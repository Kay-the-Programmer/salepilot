import React, { useState, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { FilterableSalesTrend } from './sales/FilterableSalesTrend';
import { FilterableSalesChannelChart } from './FilterableSalesChannelChart';
import { FilterableTopSales } from './FilterableTopSales';
import { StoreSettings, DashboardCardConfig } from '../../types';
import { RecentOrdersTable } from './overview/RecentOrdersTable';
import { InteractiveOperatingExpensesCard } from './overview/InteractiveOperatingExpensesCard';
import { InteractiveNetProfitCard } from './overview/InteractiveNetProfitCard';
import { FilterableCashflowTrend } from './cashflow/FilterableCashflowTrend';
import { TipsCard } from './overview/TipsCard';
import { DashboardCardWrapper } from './DashboardCardWrapper';
import { EyeOff, CheckCircle2 } from 'lucide-react';

interface OverviewTabProps {
    reportData: any;
    storeSettings: StoreSettings;
    userName?: string;
    recentOrdersTab: 'all' | 'online' | 'pos';
    setRecentOrdersTab: (tab: 'all' | 'online' | 'pos') => void;
    isEditMode: boolean;
    cardConfig: DashboardCardConfig[];
    setCardConfig: React.Dispatch<React.SetStateAction<DashboardCardConfig[]>>;
    toggleCardVisibility: (id: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    reportData,
    storeSettings,
    recentOrdersTab,
    setRecentOrdersTab,
    isEditMode,
    cardConfig,
    setCardConfig,
    toggleCardVisibility
}) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [showSaveFeedback, setShowSaveFeedback] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            setCardConfig((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                setShowSaveFeedback(true);
                setTimeout(() => setShowSaveFeedback(false), 2000);

                return newItems.map((item, index) => ({
                    ...item,
                    order: index
                }));
            });
        }
    };

    const sales = reportData.sales;

    // Components Map
    const renderCardContent = (id: string) => {
        switch (id) {
            case 'tips':
                return (
                    <TipsCard
                        hasProducts={reportData.inventory.totalProducts > 0}
                        hasExpenses={reportData.sales.totalOperatingExpenses > 0}
                        hasSuppliers={reportData.customers.totalSuppliers > 0}
                        hasCustomers={reportData.customers.totalCustomers > 0}
                        hasSales={reportData.sales.totalRevenue > 0}
                    />
                );
            case 'expenses':
                return <InteractiveOperatingExpensesCard storeSettings={storeSettings} />;
            case 'profit':
                return <InteractiveNetProfitCard storeSettings={storeSettings} />;
            case 'cashflow':
                return <FilterableCashflowTrend storeSettings={storeSettings} />;
            case 'sales-trend':
                return <FilterableSalesTrend storeSettings={storeSettings} />;
            case 'channels':
                return <FilterableSalesChannelChart totalRevenue={sales.totalRevenue} />;
            case 'recent-orders':
                return (
                    <RecentOrdersTable
                        recentOrders={reportData.sales.recentOrders}
                        recentOrdersTab={recentOrdersTab}
                        setRecentOrdersTab={setRecentOrdersTab}
                        storeSettings={storeSettings}
                    />
                );
            case 'top-sales':
                return <FilterableTopSales storeSettings={storeSettings} />;
            default:
                return null;
        }
    };

    const getCardSpan = (id: string, isHidden: boolean) => {
        if (isHidden) return "col-span-1";
        if (id === 'sales-trend' || id === 'recent-orders') return "md:col-span-2 lg:col-span-4";
        if (id === 'cashflow') return "md:col-span-2";
        return "col-span-1";
    };

    const visibleCards = useMemo(() => cardConfig.filter(c => c.visible), [cardConfig]);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Minimal Save Feedback Indicator */}
            {showSaveFeedback && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                    <span>Layout Updated</span>
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* Active Grid Area */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-50">Active Highlights</h3>
                        </div>
                    </div>
                    <SortableContext
                        items={visibleCards.map(c => c.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
                            style={{ gridAutoFlow: 'dense' }}
                        >
                            {visibleCards.map((card) => (
                                <DashboardCardWrapper
                                    key={card.id}
                                    id={card.id}
                                    className={getCardSpan(card.id, false)}
                                    isEditMode={isEditMode}
                                >
                                    <div className={`group/card relative min-w-0 h-full transition-all duration-500 ${isEditMode ? 'ring-2 ring-blue-500/20 rounded-[32px] bg-slate-50/50 dark:bg-white/5 p-2' : ''}`}>
                                        {isEditMode && (
                                            <button
                                                onClick={() => toggleCardVisibility(card.id)}
                                                className="absolute top-3 md:top-4 right-12 md:right-14 z-[65] p-2.5 md:p-2 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl border border-slate-200 dark:border-white/10 shadow-lg transition-all hover:scale-110 active:scale-90 hover:text-rose-600 dark:hover:text-rose-400"
                                                title="Hide Card"
                                            >
                                                <EyeOff className="w-5 h-5 md:w-4 md:h-4" />
                                            </button>
                                        )}
                                        {renderCardContent(card.id)}
                                    </div>
                                </DashboardCardWrapper>
                            ))}
                        </div>
                    </SortableContext>
                </div>

                {/* Drag Overlay for smooth visual feedback */}
                <DragOverlay dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: {
                            active: {
                                opacity: '0.4',
                            },
                        },
                    }),
                }}>
                    {activeId ? (
                        <div className="w-full h-full max-w-[400px]">
                            <DashboardCardWrapper id={activeId} isOverlay={true} isEditMode={isEditMode}>
                                <div className="pointer-events-none ring-4 ring-blue-500/30 rounded-[32px] overflow-hidden">
                                    {renderCardContent(activeId)}
                                </div>
                            </DashboardCardWrapper>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

        </div>
    );
};
