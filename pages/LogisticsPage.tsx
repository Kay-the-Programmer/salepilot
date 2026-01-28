import { useState, useEffect } from 'react';
import { Shipment, Courier, Bus } from '../types';
import { PlusIcon, TruckIcon, XMarkIcon, GridIcon, ListIcon } from '../components/icons/index';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import { api } from '../services/api';
import { formatCurrency } from '../utils/currency';

export default function LogisticsPage() {
    const [activeTab, setActiveTab] = useState<'shipments' | 'couriers' | 'buses'>('shipments');
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [buses, setBuses] = useState<Bus[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
    const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
    const [isBusModalOpen, setIsBusModalOpen] = useState(false);

    // Forms State
    const [newCourier, setNewCourier] = useState<Partial<Courier>>({ isActive: true });
    const [newBus, setNewBus] = useState<Partial<Bus>>({ isActive: true });

    const [newShipment, setNewShipment] = useState<Partial<Shipment>>({
        status: 'pending',
        shipping_cost: 0,
        method: 'courier'
    });

    // UI Helpers
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // Selection state for detail pane
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
    const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
    const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

    // Confirmation Modal State
    const [confirmationModal, setConfirmationModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    // Check if any detail pane is open
    const isDetailPaneOpen = selectedShipment !== null || selectedCourier !== null || selectedBus !== null;

    // Close detail pane when switching tabs
    const handleTabChange = (tab: 'shipments' | 'couriers' | 'buses') => {
        setActiveTab(tab);
        setSelectedShipment(null);
        setSelectedCourier(null);
        setSelectedBus(null);
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [shipmentData, courierData, busData] = await Promise.all([
                api.get<Shipment[]>('/logistics/shipments'),
                api.get<Courier[]>('/logistics/couriers'),
                api.get<Bus[]>('/logistics/buses')
            ]);
            setShipments(shipmentData || []);
            setCouriers(courierData || []);
            setBuses(busData || []);
        } catch (error) {
            console.error("Failed to load logistics data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateCourier = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const created = await api.post<Courier>('/logistics/couriers', newCourier);
            setCouriers(prev => [created, ...prev]);
            setIsCourierModalOpen(false);
            setNewCourier({ isActive: true });
        } catch (err) {
            alert('Failed to create courier');
        }
    };

    const handleCreateBus = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const created = await api.post<Bus>('/logistics/buses', newBus);
            setBuses(prev => [created, ...prev]);
            setIsBusModalOpen(false);
            setNewBus({ isActive: true });
        } catch (err) {
            alert('Failed to create bus');
        }
    };

    const handleCreateShipment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...newShipment,
                tracking_number: newShipment.tracking_number || `TRK-${Date.now()}`
            };
            const created = await api.post<Shipment>('/logistics/shipments', payload);
            setShipments(prev => [created, ...prev]);
            setIsShipmentModalOpen(false);
            setNewShipment({ status: 'pending', shipping_cost: 0, method: 'courier' });
        } catch (err) {
            alert('Failed to create shipment');
        }
    };

    const handleDelete = async (id: string, type: 'courier' | 'bus' | 'shipment') => {
        if (type === 'shipment') return; // Shipments cannot be deleted

        setConfirmationModal({
            isOpen: true,
            title: `Delete ${type === 'courier' ? 'Courier' : 'Bus'}`,
            message: 'Are you sure you want to delete this item? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/logistics/${type}s/${id}`);
                    if (type === 'courier') setCouriers(prev => prev.filter(c => c.id !== id));
                    if (type === 'bus') setBuses(prev => prev.filter(b => b.id !== id));
                    setConfirmationModal(null);
                } catch (err) {
                    alert('Failed to delete');
                }
            }
        });
    };

    const handleUpdateStatus = (id: string, newStatus: string) => {
        setConfirmationModal({
            isOpen: true,
            title: 'Update Shipment Status',
            message: `Are you sure you want to update the status to '${newStatus.toUpperCase()}'?`,
            onConfirm: async () => {
                try {
                    const updated = await api.patch<Shipment>(`/logistics/shipments/${id}/status`, { status: newStatus });
                    setShipments(prev => prev.map(s => s.id === id ? updated : s));
                    if (selectedShipment?.id === id) {
                        setSelectedShipment(updated);
                    }
                    setConfirmationModal(null);
                } catch (err) {
                    alert('Failed to update status');
                }
            }
        });
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <TruckIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Logistics</h1>
                        <p className="text-sm text-gray-500">Manage shipments, couriers, and buses</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium w-full md:w-auto overflow-x-auto">
                        <button onClick={() => handleTabChange('shipments')} className={`px-4 py-2 rounded-md transition-all whitespace-nowrap ${activeTab === 'shipments' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Shipments</button>
                        <button onClick={() => handleTabChange('couriers')} className={`px-4 py-2 rounded-md transition-all whitespace-nowrap ${activeTab === 'couriers' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Couriers</button>
                        <button onClick={() => handleTabChange('buses')} className={`px-4 py-2 rounded-md transition-all whitespace-nowrap ${activeTab === 'buses' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Buses</button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            title="List View"
                        >
                            <ListIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            title="Grid View"
                        >
                            <GridIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {activeTab === 'shipments' && (
                        <Button onClick={() => setIsShipmentModalOpen(true)} icon={<PlusIcon className="w-5 h-5" />}>New Shipment</Button>
                    )}
                    {activeTab === 'couriers' && (
                        <Button onClick={() => setIsCourierModalOpen(true)} icon={<PlusIcon className="w-5 h-5" />}>Add Courier</Button>
                    )}
                    {activeTab === 'buses' && (
                        <Button onClick={() => setIsBusModalOpen(true)} icon={<PlusIcon className="w-5 h-5" />}>Add Bus</Button>
                    )}
                </div>
            </div>

            {/* Content - Split Layout */}
            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Main List/Grid Area */}
                <div className={`${isDetailPaneOpen ? 'hidden md:block' : ''} flex-1 overflow-auto bg-white rounded-lg shadow border border-gray-200 transition-all`}>
                    {activeTab === 'shipments' && viewMode === 'list' && (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tracking</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Provider</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Recipient</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Cost</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {shipments.map(shipment => {
                                    const providerName = shipment.method === 'courier'
                                        ? couriers.find(c => c.id === shipment.courier_id)?.company_name
                                        : buses.find(b => b.id === shipment.bus_id)?.driver_name + (buses.find(b => b.id === shipment.bus_id)?.number_plate ? ` (${buses.find(b => b.id === shipment.bus_id)?.number_plate})` : '');
                                    const isSelected = selectedShipment?.id === shipment.id;
                                    return (
                                        <tr
                                            key={shipment.id}
                                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                                            onClick={() => setSelectedShipment(shipment)}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{shipment.tracking_number}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 capitalize">{shipment.method}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{providerName || 'Unknown'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="font-medium text-gray-900">{shipment.recipient_name}</div>
                                                <div className="text-xs">{shipment.recipient_address}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                        shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {shipment.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(shipment.shipping_cost, { currency: { symbol: 'K', code: 'ZMW', position: 'before' } } as any)}</td>
                                        </tr>
                                    )
                                })}
                                {shipments.length === 0 && !isLoading && (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-500">No shipments found</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'shipments' && viewMode === 'grid' && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {shipments.map(shipment => {
                                const providerName = shipment.method === 'courier'
                                    ? couriers.find(c => c.id === shipment.courier_id)?.company_name
                                    : buses.find(b => b.id === shipment.bus_id)?.driver_name + (buses.find(b => b.id === shipment.bus_id)?.number_plate ? ` (${buses.find(b => b.id === shipment.bus_id)?.number_plate})` : '');
                                const isSelected = selectedShipment?.id === shipment.id;
                                return (
                                    <div
                                        key={shipment.id}
                                        className={`bg-white p-5 rounded-lg shadow border-2 hover:shadow-md transition-all cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
                                        onClick={() => setSelectedShipment(shipment)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">{shipment.tracking_number}</span>
                                                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                        shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {shipment.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <p className="font-semibold text-gray-900">{shipment.recipient_name}</p>
                                            <p className="text-sm text-gray-500">{shipment.recipient_address}</p>
                                            <p className="text-sm text-gray-500 mt-1">{shipment.recipient_phone}</p>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                                            <span className="text-sm text-gray-500 capitalize">
                                                <TruckIcon className="w-4 h-4 inline mr-1" />
                                                {shipment.method}: {providerName || 'N/A'}
                                            </span>
                                            <span className="font-bold text-gray-900">{formatCurrency(shipment.shipping_cost, { currency: { symbol: 'K', code: 'ZMW', position: 'before' } } as any)}</span>
                                        </div>
                                    </div>
                                )
                            })}
                            {shipments.length === 0 && !isLoading && <div className="col-span-full text-center text-gray-500 py-10">No shipments found</div>}
                        </div>
                    )}

                    {activeTab === 'couriers' && viewMode === 'list' && (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Company Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Contact Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Receipt Info</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {couriers.map(courier => {
                                    const isSelected = selectedCourier?.id === courier.id;
                                    return (
                                        <tr
                                            key={courier.id}
                                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                                            onClick={() => setSelectedCourier(courier)}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{courier.company_name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{courier.contact_details || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{courier.receipt_details || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${courier.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {courier.isActive !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium">
                                                <button onClick={() => handleDelete(courier.id, 'courier')} className="text-red-600 hover:text-red-900">Delete</button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {couriers.length === 0 && !isLoading && (
                                    <tr><td colSpan={5} className="text-center py-10 text-gray-500">No couriers found</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'couriers' && viewMode === 'grid' && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {couriers.map(courier => {
                                const isSelected = selectedCourier?.id === courier.id;
                                return (
                                    <div
                                        key={courier.id}
                                        className={`bg-white p-5 rounded-lg shadow border-2 hover:shadow-md transition-all cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
                                        onClick={() => setSelectedCourier(courier)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{courier.company_name}</h3>
                                                <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${courier.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {courier.isActive !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <button onClick={() => handleDelete(courier.id, 'courier')} className="text-red-500 hover:text-red-700"><XMarkIcon className="w-4 h-4" /></button>
                                        </div>
                                        <div className="mt-3 text-sm text-gray-600 space-y-1">
                                            {courier.contact_details && <p><span className="font-medium">Contact:</span> {courier.contact_details}</p>}
                                            {courier.receipt_details && <p><span className="font-medium">Receipt Info:</span> {courier.receipt_details}</p>}
                                        </div>
                                    </div>
                                )
                            })}
                            {couriers.length === 0 && !isLoading && <div className="col-span-full text-center text-gray-500 py-10">No couriers found</div>}
                        </div>
                    )}

                    {activeTab === 'buses' && viewMode === 'list' && (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Driver Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Number Plate</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Vehicle</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {buses.map(bus => {
                                    const isSelected = selectedBus?.id === bus.id;
                                    return (
                                        <tr
                                            key={bus.id}
                                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                                            onClick={() => setSelectedBus(bus)}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{bus.driver_name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">{bus.number_plate}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{bus.vehicle_name || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{bus.contact_phone || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bus.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {bus.isActive !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium">
                                                <button onClick={() => handleDelete(bus.id, 'bus')} className="text-red-600 hover:text-red-900">Delete</button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {buses.length === 0 && !isLoading && (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-500">No buses found</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'buses' && viewMode === 'grid' && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {buses.map(bus => {
                                const isSelected = selectedBus?.id === bus.id;
                                return (
                                    <div
                                        key={bus.id}
                                        className={`bg-white p-5 rounded-lg shadow border-2 hover:shadow-md transition-all cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
                                        onClick={() => setSelectedBus(bus)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{bus.driver_name}</h3>
                                                <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{bus.number_plate}</span>
                                            </div>
                                            <button onClick={() => handleDelete(bus.id, 'bus')} className="text-red-500 hover:text-red-700"><XMarkIcon className="w-4 h-4" /></button>
                                        </div>
                                        <div className="mt-3 text-sm text-gray-600 space-y-1">
                                            {bus.vehicle_name && <p><span className="font-medium">Vehicle:</span> {bus.vehicle_name}</p>}
                                            {bus.contact_phone && <p><span className="font-medium">Phone:</span> {bus.contact_phone}</p>}
                                            <span className={`mt-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bus.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {bus.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                            {buses.length === 0 && !isLoading && <div className="col-span-full text-center text-gray-500 py-10">No buses found</div>}
                        </div>
                    )}
                </div>

                {/* Detail Pane - Responsive slide-over on mobile, side panel on desktop */}
                {
                    isDetailPaneOpen && (
                        <>
                            {/* Mobile overlay background */}
                            <div
                                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                                onClick={() => {
                                    setSelectedShipment(null);
                                    setSelectedCourier(null);
                                    setSelectedBus(null);
                                }}
                            />

                            {/* Detail Panel */}
                            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 lg:relative lg:z-0 lg:w-96 lg:max-w-none lg:shadow-none lg:border-l lg:border-gray-200 overflow-y-auto animate-slide-in-right">
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {selectedShipment && 'Shipment Details'}
                                            {selectedCourier && 'Courier Details'}
                                            {selectedBus && 'Bus Details'}
                                        </h2>
                                        <button
                                            onClick={() => {
                                                setSelectedShipment(null);
                                                setSelectedCourier(null);
                                                setSelectedBus(null);
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <XMarkIcon className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>

                                    {/* Shipment Details */}
                                    {selectedShipment && (
                                        <div className="space-y-6">
                                            {/* Status Badge */}
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 text-sm font-semibold rounded-full
                                                ${selectedShipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                        selectedShipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {selectedShipment.status?.toUpperCase()}
                                                </span>
                                                <span className="text-sm text-gray-500 capitalize">{selectedShipment.method}</span>
                                            </div>

                                            {/* Status Update */}
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Update Status</label>
                                                <select
                                                    className="block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                                    value={selectedShipment.status}
                                                    onChange={(e) => handleUpdateStatus(selectedShipment.id, e.target.value)}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="in_transit">In Transit</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="failed">Failed</option>
                                                    <option value="returned">Returned</option>
                                                </select>
                                            </div>

                                            {/* Tracking */}
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Tracking Number</p>
                                                <p className="text-lg font-bold text-blue-800 font-mono">{selectedShipment.tracking_number}</p>
                                            </div>

                                            {/* Recipient */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-gray-900 border-b pb-2">Recipient Information</h3>
                                                <div className="grid grid-cols-1 gap-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase">Name</p>
                                                        <p className="font-medium text-gray-900">{selectedShipment.recipient_name || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase">Phone</p>
                                                        <p className="font-medium text-gray-900">{selectedShipment.recipient_phone || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase">Address</p>
                                                        <p className="font-medium text-gray-900">{selectedShipment.recipient_address || '-'}</p>
                                                    </div>
                                                    {selectedShipment.destination && (
                                                        <div>
                                                            <p className="text-xs text-gray-500 uppercase">Destination</p>
                                                            <p className="font-medium text-gray-900">{selectedShipment.destination}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Provider */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-gray-900 border-b pb-2">Shipping Provider</h3>
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <TruckIcon className="w-8 h-8 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {selectedShipment.method === 'courier'
                                                                    ? couriers.find(c => c.id === selectedShipment.courier_id)?.company_name || 'Unknown Courier'
                                                                    : buses.find(b => b.id === selectedShipment.bus_id)?.driver_name || 'Unknown Bus'}
                                                            </p>
                                                            <p className="text-sm text-gray-500 capitalize">{selectedShipment.method}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Cost */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-gray-900 border-b pb-2">Shipping Cost</h3>
                                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedShipment.shipping_cost, { currency: { symbol: 'K', code: 'ZMW', position: 'before' } } as any)}</p>
                                            </div>

                                            {/* Notes */}
                                            {selectedShipment.notes && (
                                                <div className="space-y-3">
                                                    <h3 className="font-semibold text-gray-900 border-b pb-2">Notes</h3>
                                                    <p className="text-gray-600">{selectedShipment.notes}</p>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            {/* Actions - Removed Deletion */}
                                        </div>
                                    )}

                                    {/* Courier Details */}
                                    {selectedCourier && (
                                        <div className="space-y-6">
                                            {/* Status Badge */}
                                            <div>
                                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${selectedCourier.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {selectedCourier.isActive !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            {/* Company Name */}
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Company Name</p>
                                                <p className="text-xl font-bold text-blue-800">{selectedCourier.company_name}</p>
                                            </div>

                                            {/* Contact Details */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase">Contact Details</p>
                                                    <p className="font-medium text-gray-900">{selectedCourier.contact_details || 'No contact information'}</p>
                                                </div>
                                            </div>

                                            {/* Receipt Details */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-gray-900 border-b pb-2">Receipt / Account Info</h3>
                                                <p className="text-gray-600">{selectedCourier.receipt_details || 'No receipt details'}</p>
                                            </div>

                                            {/* Shipments using this courier */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-gray-900 border-b pb-2">Active Shipments</h3>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {shipments.filter(s => s.courier_id === selectedCourier.id).length}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="pt-4 border-t space-y-3">
                                                <Button
                                                    variant="danger"
                                                    className="w-full"
                                                    onClick={() => {
                                                        handleDelete(selectedCourier.id, 'courier');
                                                        setSelectedCourier(null);
                                                    }}
                                                >
                                                    Delete Courier
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bus Details */}
                                    {selectedBus && (
                                        <div className="space-y-6">
                                            {/* Status Badge */}
                                            <div>
                                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${selectedBus.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {selectedBus.isActive !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            {/* Driver Name & Plate */}
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Driver Name</p>
                                                <p className="text-xl font-bold text-blue-800">{selectedBus.driver_name}</p>
                                                <p className="text-sm font-mono text-blue-600 mt-1">{selectedBus.number_plate}</p>
                                            </div>

                                            {/* Vehicle Info */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-gray-900 border-b pb-2">Vehicle Information</h3>
                                                <div className="grid grid-cols-1 gap-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase">Vehicle Name</p>
                                                        <p className="font-medium text-gray-900">{selectedBus.vehicle_name || 'Not specified'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase">Number Plate</p>
                                                        <p className="font-medium text-gray-900 font-mono">{selectedBus.number_plate}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contact */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-gray-900 border-b pb-2">Contact</h3>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase">Phone</p>
                                                    <p className="font-medium text-gray-900">{selectedBus.contact_phone || 'No phone number'}</p>
                                                </div>
                                            </div>

                                            {/* Shipments using this bus */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-gray-900 border-b pb-2">Active Shipments</h3>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {shipments.filter(s => s.bus_id === selectedBus.id).length}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="pt-4 border-t space-y-3">
                                                <Button
                                                    variant="danger"
                                                    className="w-full"
                                                    onClick={() => {
                                                        handleDelete(selectedBus.id, 'bus');
                                                        setSelectedBus(null);
                                                    }}
                                                >
                                                    Delete Bus
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )
                }
            </div>

            {/* Modals */}
            {
                isCourierModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-bold">Add Courier</h3>
                                <button onClick={() => setIsCourierModalOpen(false)}><XMarkIcon className="w-6 h-6 text-gray-400" /></button>
                            </div>
                            <form onSubmit={handleCreateCourier} className="space-y-4">
                                <InputField label="Company Name" required value={newCourier.company_name || ''} onChange={e => setNewCourier({ ...newCourier, company_name: e.target.value })} />
                                <InputField label="Contact Details" value={newCourier.contact_details || ''} onChange={e => setNewCourier({ ...newCourier, contact_details: e.target.value })} />
                                <InputField label="Receipt / Account Details" value={newCourier.receipt_details || ''} onChange={e => setNewCourier({ ...newCourier, receipt_details: e.target.value })} />
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="secondary" onClick={() => setIsCourierModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Save Courier</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                isBusModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-bold">Add Bus</h3>
                                <button onClick={() => setIsBusModalOpen(false)}><XMarkIcon className="w-6 h-6 text-gray-400" /></button>
                            </div>
                            <form onSubmit={handleCreateBus} className="space-y-4">
                                <InputField label="Driver Name" required value={newBus.driver_name || ''} onChange={e => setNewBus({ ...newBus, driver_name: e.target.value })} />
                                <InputField label="Number Plate" required value={newBus.number_plate || ''} onChange={e => setNewBus({ ...newBus, number_plate: e.target.value })} />
                                <InputField label="Vehicle Name (Optional)" value={newBus.vehicle_name || ''} onChange={e => setNewBus({ ...newBus, vehicle_name: e.target.value })} />
                                <InputField label="Contact Phone" value={newBus.contact_phone || ''} onChange={e => setNewBus({ ...newBus, contact_phone: e.target.value })} />
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="secondary" onClick={() => setIsBusModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Save Bus</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                isShipmentModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-lg w-full p-6">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-bold">New Shipment</h3>
                                <button onClick={() => setIsShipmentModalOpen(false)}><XMarkIcon className="w-6 h-6 text-gray-400" /></button>
                            </div>
                            <form onSubmit={handleCreateShipment} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Shipping Method</label>
                                    <div className="mt-1 flex gap-4">
                                        <label className="flex items-center">
                                            <input type="radio" value="courier" checked={newShipment.method === 'courier'} onChange={() => setNewShipment({ ...newShipment, method: 'courier', bus_id: undefined })} className="mr-2" />
                                            Courier
                                        </label>
                                        <label className="flex items-center">
                                            <input type="radio" value="bus" checked={newShipment.method === 'bus'} onChange={() => setNewShipment({ ...newShipment, method: 'bus', courier_id: undefined })} className="mr-2" />
                                            Bus
                                        </label>
                                    </div>
                                </div>

                                {newShipment.method === 'courier' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Select Courier</label>
                                        <select className="mt-1 block w-full p-2 border rounded-md"
                                            value={newShipment.courier_id || ''}
                                            onChange={e => setNewShipment({ ...newShipment, courier_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Courier...</option>
                                            {couriers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Select Bus</label>
                                        <select className="mt-1 block w-full p-2 border rounded-md"
                                            value={newShipment.bus_id || ''}
                                            onChange={e => setNewShipment({ ...newShipment, bus_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Bus...</option>
                                            {buses.map(b => <option key={b.id} value={b.id}>{b.driver_name} ({b.number_plate})</option>)}
                                        </select>
                                    </div>
                                )}

                                <InputField label="Recipient Name" required value={newShipment.recipient_name || ''} onChange={e => setNewShipment({ ...newShipment, recipient_name: e.target.value })} />
                                <InputField label="Recipient Phone" required value={newShipment.recipient_phone || ''} onChange={e => setNewShipment({ ...newShipment, recipient_phone: e.target.value })} />
                                <InputField label="Destination Address" required value={newShipment.recipient_address || ''} onChange={e => setNewShipment({ ...newShipment, recipient_address: e.target.value })} />

                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Tracking Number (Optional)" value={newShipment.tracking_number || ''} onChange={e => setNewShipment({ ...newShipment, tracking_number: e.target.value })} />
                                    <InputField label="Cost" type="number" required value={newShipment.shipping_cost || 0} onChange={e => setNewShipment({ ...newShipment, shipping_cost: parseFloat(e.target.value) })} />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="secondary" onClick={() => setIsShipmentModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Create Shipment</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Confirmation Modal */}
            {confirmationModal && confirmationModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmationModal.title}</h3>
                        <p className="text-gray-600 mb-6">{confirmationModal.message}</p>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setConfirmationModal(null)}>Cancel</Button>
                            <Button onClick={confirmationModal.onConfirm}>Confirm</Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
