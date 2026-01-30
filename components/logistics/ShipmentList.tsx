import React from 'react';
import { Shipment, Courier, Bus } from '@/types';
import { TruckIcon } from '../icons/index';
import { formatCurrency } from '@/utils/currency';
import UnifiedListGrid from '../ui/UnifiedListGrid';
import { StandardCard, StandardRow } from '../ui/standard';

interface ShipmentListProps {
    shipments: Shipment[];
    couriers: Courier[];
    buses: Bus[];
    viewMode: 'grid' | 'list';
    onSelect: (shipment: Shipment) => void;
    selectedId: string | null;
}

const ShipmentList: React.FC<ShipmentListProps> = ({
    shipments,
    couriers,
    buses,
    viewMode,
    onSelect,
    selectedId
}) => {
    // Helper to get provider name
    const getProviderName = (shipment: Shipment) => {
        if (shipment.method === 'courier') {
            return couriers.find(c => c.id === shipment.courier_id)?.company_name || 'Unknown';
        }
        const bus = buses.find(b => b.id === shipment.bus_id);
        if (!bus) return 'Unknown';
        return `${bus.driver_name}${bus.number_plate ? ` (${bus.number_plate})` : ''}`;
    };

    return (
        <div className="flex flex-col h-full">
            <UnifiedListGrid<Shipment>
                items={shipments}
                viewMode={viewMode}
                isLoading={false}
                emptyMessage="No shipments found."
                getItemId={(item) => item.id}
                onItemClick={onSelect}
                selectedId={selectedId}
                className={viewMode === 'list' ? '!p-0' : ''}
                listClassName="space-y-0 divide-y divide-gray-200"
                renderGridItem={(shipment, _index, isSelected) => {
                    const providerName = getProviderName(shipment);
                    return (
                        <StandardCard
                            title={shipment.recipient_name || 'Unknown Recipient'}
                            subtitle={shipment.tracking_number}
                            isSelected={isSelected}
                            onClick={() => onSelect(shipment)}
                            status={
                                <span className={`px-2 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-md
                                    ${shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                        shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {shipment.status}
                                </span>
                            }
                            primaryInfo={formatCurrency(shipment.shipping_cost, { currency: { symbol: 'K', code: 'ZMW', position: 'before' } } as any)}
                            secondaryInfo={
                                <div className="space-y-1 mt-1">
                                    <div className="text-xs text-gray-500 truncate" title={shipment.recipient_address}>
                                        {shipment.recipient_address}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                                        <TruckIcon className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="truncate capitalize">{shipment.method}: {providerName}</span>
                                    </div>
                                </div>
                            }
                        />
                    );
                }}
                renderListItem={(shipment, _index, isSelected) => {
                    const providerName = getProviderName(shipment);
                    return (
                        <StandardRow
                            title={shipment.recipient_name || 'Unknown Recipient'}
                            subtitle={`Tracking: ${shipment.tracking_number}`}
                            isSelected={isSelected}
                            onClick={() => onSelect(shipment)}
                            status={
                                <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full
                                    ${shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                        shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {shipment.status.toUpperCase()}
                                </span>
                            }
                            primaryMeta={formatCurrency(shipment.shipping_cost, { currency: { symbol: 'K', code: 'ZMW', position: 'before' } } as any)}
                            details={[
                                <span className="capitalize flex items-center gap-1" key="method">
                                    <TruckIcon className="w-3.5 h-3.5 text-gray-400" />
                                    {shipment.method}: {providerName}
                                </span>,
                                <span className="truncate max-w-[200px]" key="addr">
                                    {shipment.recipient_address}
                                </span>
                            ]}
                        />
                    );
                }}
            />
        </div>
    );
};

export default ShipmentList;
