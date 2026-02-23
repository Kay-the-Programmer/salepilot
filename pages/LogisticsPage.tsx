import { useState, useEffect } from 'react';
import { Shipment, Courier, Bus } from '../types';

import { PlusIcon, TruckIcon, XMarkIcon, TrashIcon } from '../components/icons/index';

import InputField from '../components/ui/InputField';
import { api } from '../services/api';
import { formatCurrency } from '../utils/currency';
import ListGridToggle from '../components/ui/ListGridToggle';
import ShipmentList from '../components/logistics/ShipmentList';
import CourierList from '../components/logistics/CourierList';
import BusList from '../components/logistics/BusList';

import { logEvent } from '../src/utils/analytics';

export default function LogisticsPage() {
    const [activeTab, setActiveTab] = useState<'shipments' | 'couriers' | 'buses'>('shipments');
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [buses, setBuses] = useState<Bus[]>([]);

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
        if (activeTab !== tab) {
            logEvent('Logistics', 'navigate_tab', tab);
        }
        setActiveTab(tab);
        setSelectedShipment(null);
        setSelectedCourier(null);
        setSelectedBus(null);
    };

    const fetchData = async () => {
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
            logEvent('Logistics', 'create_courier');
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
            logEvent('Logistics', 'create_bus');
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
            logEvent('Logistics', 'create_shipment', newShipment.method);
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
                    logEvent('Logistics', `delete_${type}`, id);
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
                    logEvent('Logistics', 'update_shipment_status', newStatus);
                } catch (err) {
                    alert('Failed to update status');
                }
            }
        });
    };

    return (
        <div className="p-0 h-full flex flex-col bg-gray-50 dark:bg-slate-950">
            {/* Header */}
            <header className="dark:bg-slate-900 backdrop-blur-md sticky top-0 z-10 p-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 text-blue-600 dark:shadow-none">
                            <TruckIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Logistics</h1>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Fleet & Shipment Management</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="bg-gray-200/80 dark:bg-slate-800/80 gap-1 p-1 rounded-xl flex text-xs font-bold w-full md:w-auto overflow-x-auto">
                            <button
                                onClick={() => handleTabChange('shipments')}
                                className={`px-5 py-2.5 rounded-lg transition-all  whitespace-nowrap uppercase tracking-widest text-[10px] ${activeTab === 'shipments' ? 'bg-white dark:bg-slate-700 shadow-lg text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
                            >
                                Shipments
                            </button>
                            <button
                                onClick={() => handleTabChange('couriers')}
                                className={`px-5 py-2.5 rounded-lg transition-all  whitespace-nowrap uppercase tracking-widest text-[10px] ${activeTab === 'couriers' ? 'bg-white dark:bg-slate-700 shadow-lg text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
                            >
                                Couriers
                            </button>
                            <button
                                onClick={() => handleTabChange('buses')}
                                className={`px-5 py-2.5 rounded-lg transition-all  whitespace-nowrap uppercase tracking-widest text-[10px] ${activeTab === 'buses' ? 'bg-white dark:bg-slate-700 shadow-lg text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
                            >
                                Buses
                            </button>
                        </div>

                        {/* View Toggle */}
                        <div className="">
                            <ListGridToggle viewMode={viewMode} onViewModeChange={setViewMode} size="sm" />
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            {activeTab === 'shipments' && (
                                <button
                                    onClick={() => setIsShipmentModalOpen(true)}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-3 dark:bg-slate-800 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] gap-2 active:scale-95 transition-all duration-300"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    New Shipment
                                </button>
                            )}
                            {activeTab === 'couriers' && (
                                <button
                                    onClick={() => setIsCourierModalOpen(true)}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-3 dark:bg-slate-800 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] gap-2 active:scale-95 transition-all duration-300"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add Courier
                                </button>
                            )}
                            {activeTab === 'buses' && (
                                <button
                                    onClick={() => setIsBusModalOpen(true)}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-3 dark:bg-slate-800 bg-blue-600/90 text-white font-black rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] gap-2 active:scale-95 transition-all duration-300"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add Bus
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Content - Split Layout */}
            <div className="flex-1 flex gap-1 overflow-hidden">
                {/* Main List/Grid Area */}
                <div className={`${isDetailPaneOpen ? 'hidden md:block' : ''} flex-1 overflow-auto bg-white/50 dark:bg-slate-900 p-2 transition-all custom-scrollbar`}>
                    {activeTab === 'shipments' && (
                        <ShipmentList
                            shipments={shipments}
                            couriers={couriers}
                            buses={buses}
                            viewMode={viewMode}
                            onSelect={setSelectedShipment}
                            selectedId={selectedShipment?.id || null}
                        />
                    )}

                    {activeTab === 'couriers' && (
                        <CourierList
                            couriers={couriers}
                            viewMode={viewMode}
                            onSelect={setSelectedCourier}
                            onDelete={(id) => handleDelete(id, 'courier')}
                            selectedId={selectedCourier?.id || null}
                        />
                    )}

                    {activeTab === 'buses' && (
                        <BusList
                            buses={buses}
                            viewMode={viewMode}
                            onSelect={setSelectedBus}
                            onDelete={(id) => handleDelete(id, 'bus')}
                            selectedId={selectedBus?.id || null}
                        />
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
                            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 lg:relative lg:z-0 lg:w-96 lg:max-w-none lg:shadow-none lg:border-l lg:border-gray-200 dark:lg:border-slate-800 overflow-y-auto animate-slide-in-right glass-effect">
                                <div className="p-4">
                                    {/* Header */}
                                    <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-slate-800">
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                                {selectedShipment && 'Shipment Details'}
                                                {selectedCourier && 'Courier Details'}
                                                {selectedBus && 'Bus Details'}
                                            </h2>
                                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">Record Viewer</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedShipment(null);
                                                setSelectedCourier(null);
                                                setSelectedBus(null);
                                            }}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all text-gray-400 dark:text-slate-500 active:scale-95 transition-all duration-300"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Shipment Details */}
                                    {selectedShipment && (
                                        <div className="space-y-6">
                                            {/* Status Badge */}
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest
                                                ${selectedShipment.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                        selectedShipment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                                                    {selectedShipment.status?.toUpperCase()}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{selectedShipment.method}</span>
                                            </div>

                                            {/* Status Update */}
                                            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Update Progress</label>
                                                <select
                                                    className="block w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-bold bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
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
                                            <div className="bg-blue-600 dark:bg-blue-600 p-5 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none">
                                                <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Tracking Identity</p>
                                                <p className="text-lg font-black text-white font-mono mt-1">{selectedShipment.tracking_number}</p>
                                            </div>

                                            {/* Recipient */}
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800 pb-2">Recipient Info</h3>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                                                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Customer</p>
                                                        <p className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{selectedShipment.recipient_name || 'N/A'}</p>
                                                    </div>
                                                    <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                                                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Contact</p>
                                                        <p className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{selectedShipment.recipient_phone || 'N/A'}</p>
                                                    </div>
                                                    <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                                                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Physical Address</p>
                                                        <p className="text-sm font-bold text-gray-700 dark:text-slate-300">{selectedShipment.recipient_address || '-'}</p>
                                                    </div>
                                                    {selectedShipment.destination && (
                                                        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                                                            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Destination</p>
                                                            <p className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{selectedShipment.destination}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Provider */}
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800 pb-2">Shipping Provider</h3>
                                                <div className="p-5 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-800">
                                                    <div className="flex items-center gap-4">
                                                        <div className="liquid-glass-card rounded-[2rem] w-12 h-12 dark:bg-slate-700 flex items-center justify-center">
                                                            <TruckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                                                {selectedShipment.method === 'courier'
                                                                    ? couriers.find(c => c.id === selectedShipment.courier_id)?.company_name || 'Unknown Courier'
                                                                    : buses.find(b => b.id === selectedShipment.bus_id)?.driver_name || 'Unknown Bus'}
                                                            </p>
                                                            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{selectedShipment.method}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Cost */}
                                            <div className="p-5 bg-slate-900 dark:bg-slate-800 rounded-2xl">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Shipping Cost</h3>
                                                <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(selectedShipment.shipping_cost, { currency: { symbol: 'K', code: 'ZMW', position: 'before' } } as any)}</p>
                                            </div>

                                            {/* Notes */}
                                            {selectedShipment.notes && (
                                                <div className="space-y-3">
                                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800 pb-2">Internal Notes</h3>
                                                    <p className="text-sm font-medium text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl italic">"{selectedShipment.notes}"</p>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            {/* Actions - Removed Deletion */}
                                        </div>
                                    )}

                                    {selectedCourier && (
                                        <div className="space-y-8">
                                            {/* Status Badge */}
                                            <div>
                                                <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest ${selectedCourier.isActive !== false ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400'}`}>
                                                    {selectedCourier.isActive !== false ? 'Active Status' : 'Inactive'}
                                                </span>
                                            </div>

                                            {/* Company Name */}
                                            <div className="bg-blue-600 dark:bg-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none">
                                                <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Courier Partner</p>
                                                <p className="text-2xl font-black text-white uppercase tracking-tight mt-1">{selectedCourier.company_name}</p>
                                            </div>

                                            {/* Info Cards */}
                                            <div className="space-y-4">
                                                <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Contact Details</h3>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedCourier.contact_details || 'No contact information available'}</p>
                                                </div>

                                                <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Billing Identity</h3>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedCourier.receipt_details || 'No receipt details'}</p>
                                                </div>

                                                <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Total Shipments</h3>
                                                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                                                        {shipments.filter(s => s.courier_id === selectedCourier.id).length}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                                                <button
                                                    onClick={() => {
                                                        handleDelete(selectedCourier.id, 'courier');
                                                        setSelectedCourier(null);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-black rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/20 active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] active:scale-95 transition-all duration-300"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                    Terminate Partner
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bus Details */}
                                    {selectedBus && (
                                        <div className="space-y-8">
                                            {/* Status Badge */}
                                            <div>
                                                <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest ${selectedBus.isActive !== false ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                    {selectedBus.isActive !== false ? 'Fleet Available' : 'Maintenance'}
                                                </span>
                                            </div>

                                            {/* Header Info */}
                                            <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-800 text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehicle Plate</p>
                                                <p className="text-3xl font-black text-white uppercase tracking-tight font-mono">{selectedBus.number_plate}</p>
                                                <p className="text-sm font-bold text-blue-400 mt-2 uppercase tracking-wide">{selectedBus.driver_name}</p>
                                            </div>

                                            {/* Details */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                                                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Make/Model</p>
                                                    <p className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{selectedBus.vehicle_name || 'Generic'}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                                                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Driver Contact</p>
                                                    <p className="font-bold text-gray-900 dark:text-white">{selectedBus.contact_phone || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                                <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Active Deliveries</h3>
                                                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                                                    {shipments.filter(s => s.bus_id === selectedBus.id).length}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                                                <button
                                                    onClick={() => {
                                                        handleDelete(selectedBus.id, 'bus');
                                                        setSelectedBus(null);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-black rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/20 active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] active:scale-95 transition-all duration-300"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                    Retire Vehicle
                                                </button>
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
            {isCourierModalOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-900 max-w-md w-full p-8 border border-gray-100 dark:border-slate-800 animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Add Courier</h3>
                                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">New Partner Entry</p>
                            </div>
                            <button
                                onClick={() => setIsCourierModalOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all text-gray-400 dark:text-slate-500 active:scale-95 transition-all duration-300"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCourier} className="space-y-6">
                            <InputField label="Company Name" required value={newCourier.company_name || ''} onChange={e => setNewCourier({ ...newCourier, company_name: e.target.value })} />
                            <InputField label="Contact Details" value={newCourier.contact_details || ''} onChange={e => setNewCourier({ ...newCourier, contact_details: e.target.value })} />
                            <InputField label="Receipt / Account Details" value={newCourier.receipt_details || ''} onChange={e => setNewCourier({ ...newCourier, receipt_details: e.target.value })} />
                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCourierModalOpen(false)}
                                    className="flex-1 px-6 py-4 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-black rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px] active:scale-95 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] active:scale-95 transition-all duration-300"
                                >
                                    Save Courier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isBusModalOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-900 max-w-md w-full p-8 border border-gray-100 dark:border-slate-800 animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Add Bus</h3>
                                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">Fleet Expansion</p>
                            </div>
                            <button
                                onClick={() => setIsBusModalOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all text-gray-400 dark:text-slate-500 active:scale-95 transition-all duration-300"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateBus} className="space-y-6">
                            <InputField label="Driver Name" required value={newBus.driver_name || ''} onChange={e => setNewBus({ ...newBus, driver_name: e.target.value })} />
                            <InputField label="Number Plate" required value={newBus.number_plate || ''} onChange={e => setNewBus({ ...newBus, number_plate: e.target.value })} />
                            <InputField label="Vehicle Name (Optional)" value={newBus.vehicle_name || ''} onChange={e => setNewBus({ ...newBus, vehicle_name: e.target.value })} />
                            <InputField label="Contact Phone" value={newBus.contact_phone || ''} onChange={e => setNewBus({ ...newBus, contact_phone: e.target.value })} />
                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsBusModalOpen(false)}
                                    className="flex-1 px-6 py-4 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-black rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px] active:scale-95 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] active:scale-95 transition-all duration-300"
                                >
                                    Save Bus
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isShipmentModalOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-900 max-w-lg w-full p-8 border border-gray-100 dark:border-slate-800 animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">New Shipment</h3>
                                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">Logistics Dispatch</p>
                            </div>
                            <button
                                onClick={() => setIsShipmentModalOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all text-gray-400 dark:text-slate-500 active:scale-95 transition-all duration-300"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateShipment} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Shipping Method</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`flex items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer ${newShipment.method === 'courier' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                        <input type="radio" value="courier" checked={newShipment.method === 'courier'} onChange={() => setNewShipment({ ...newShipment, method: 'courier', bus_id: undefined })} className="sr-only" />
                                        <TruckIcon className="w-5 h-5 mr-2" />
                                        <span className="text-xs font-black uppercase tracking-widest">Courier</span>
                                    </label>
                                    <label className={`flex items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer ${newShipment.method === 'bus' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                        <input type="radio" value="bus" checked={newShipment.method === 'bus'} onChange={() => setNewShipment({ ...newShipment, method: 'bus', courier_id: undefined })} className="sr-only" />
                                        <TruckIcon className="w-5 h-5 mr-2 rotate-180" />
                                        <span className="text-xs font-black uppercase tracking-widest">Bus</span>
                                    </label>
                                </div>
                            </div>

                            {newShipment.method === 'courier' ? (
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Select Courier</label>
                                    <select
                                        className="block w-full p-4 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-bold bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
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
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Select Bus</label>
                                    <select
                                        className="block w-full p-4 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-bold bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={newShipment.bus_id || ''}
                                        onChange={e => setNewShipment({ ...newShipment, bus_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Bus...</option>
                                        {buses.map(b => <option key={b.id} value={b.id}>{b.driver_name} ({b.number_plate})</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Recipient Name" required value={newShipment.recipient_name || ''} onChange={e => setNewShipment({ ...newShipment, recipient_name: e.target.value })} />
                                <InputField label="Recipient Phone" required value={newShipment.recipient_phone || ''} onChange={e => setNewShipment({ ...newShipment, recipient_phone: e.target.value })} />
                            </div>
                            <InputField label="Destination Address" required value={newShipment.recipient_address || ''} onChange={e => setNewShipment({ ...newShipment, recipient_address: e.target.value })} />

                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Tracking Number (Optional)" value={newShipment.tracking_number || ''} onChange={e => setNewShipment({ ...newShipment, tracking_number: e.target.value })} />
                                <InputField label="Cost (ZMW)" type="number" required value={newShipment.shipping_cost || 0} onChange={e => setNewShipment({ ...newShipment, shipping_cost: parseFloat(e.target.value) })} />
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsShipmentModalOpen(false)}
                                    className="flex-1 px-6 py-4 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-black rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px] active:scale-95 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] active:scale-95 transition-all duration-300"
                                >
                                    Create Shipment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmationModal && confirmationModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-900 max-w-md w-full p-8 animate-scale-in border border-gray-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-2xl flex items-center justify-center mb-6">
                            <TrashIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">{confirmationModal.title}</h3>
                        <p className="text-gray-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">{confirmationModal.message}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmationModal(null)}
                                className="flex-1 px-6 py-4 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-black rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px] active:scale-95 transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmationModal.onConfirm}
                                className="flex-1 px-6 py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 dark:shadow-none hover:bg-red-700 active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] active:scale-95 transition-all duration-300"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
