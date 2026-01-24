import { useState, useEffect } from 'react';
import { Shipment, Courier } from '../types';
import { PlusIcon, TruckIcon, XMarkIcon, UserGroupIcon, MapPinIcon } from '../components/icons/index';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import { api } from '../services/api';
import { formatCurrency } from '../utils/currency';

export default function LogisticsPage() {
    const [activeTab, setActiveTab] = useState<'shipments' | 'couriers'>('shipments');
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
    const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);

    // Forms State
    const [newCourier, setNewCourier] = useState<Partial<Courier>>({ type: 'courier', isActive: true });
    const [newShipment, setNewShipment] = useState<Partial<Shipment>>({ status: 'pending', shippingCost: 0 });
    const [recipient, setRecipient] = useState({ name: '', phone: '', address: '', instructions: '' });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [shipmentData, courierData] = await Promise.all([
                api.get<Shipment[]>('/logistics/shipments'),
                api.get<Courier[]>('/logistics/couriers')
            ]);
            setShipments(shipmentData || []);
            setCouriers(courierData || []);
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
            const created = await api.post<Courier>('/logistics/couriers', { ...newCourier });
            setCouriers(prev => [created, ...prev]);
            setIsCourierModalOpen(false);
            setNewCourier({ type: 'courier', isActive: true });
        } catch (err) {
            alert('Failed to create courier');
        }
    };

    const handleCreateShipment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...newShipment,
                recipientDetails: recipient,
                courierId: newShipment.courierId,
                trackingNumber: newShipment.trackingNumber || `TRK-${Date.now()}`
            };
            const created = await api.post<Shipment>('/logistics/shipments', payload);
            setShipments(prev => [created, ...prev]);
            setIsShipmentModalOpen(false);
            setNewShipment({ status: 'pending', shippingCost: 0 });
            setRecipient({ name: '', phone: '', address: '', instructions: '' });
        } catch (err) {
            alert('Failed to create shipment');
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <TruckIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Logistics</h1>
                        <p className="text-sm text-gray-500">Manage shipments and couriers</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                        <button
                            onClick={() => setActiveTab('shipments')}
                            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'shipments' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Shipments
                        </button>
                        <button
                            onClick={() => setActiveTab('couriers')}
                            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'couriers' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Couriers
                        </button>
                    </div>
                    <Button onClick={() => activeTab === 'shipments' ? setIsShipmentModalOpen(true) : setIsCourierModalOpen(true)} icon={<PlusIcon className="w-5 h-5" />}>
                        {activeTab === 'shipments' ? 'New Shipment' : 'Add Courier'}
                    </Button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'shipments' ? (
                <div className="flex-1 overflow-auto bg-white rounded-lg shadow border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Courier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {shipments.map(shipment => (
                                <tr key={shipment.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{shipment.trackingNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {couriers.find(c => c.id === shipment.courierId)?.name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="font-medium text-gray-900">{shipment.recipientDetails.name}</div>
                                        <div className="text-xs">{shipment.recipientDetails.address}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                            ${shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'}`}>
                                            {shipment.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(shipment.shippingCost, { currency: { symbol: 'K', code: 'ZMW', position: 'before' } } as any)}</td>
                                </tr>
                            ))}
                            {shipments.length === 0 && !isLoading && (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-500">No shipments found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {couriers.map(courier => (
                        <div key={courier.id} className="bg-white p-5 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-gray-900">{courier.name}</h3>
                                <span className="px-2 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded capitalize">{courier.type.replace('_', ' ')}</span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2"><UserGroupIcon className="w-4 h-4" /> {courier.contactPerson || 'No contact'}</div>
                                <div className="flex items-center gap-2"><MapPinIcon className="w-4 h-4" /> {courier.phone || 'No phone'}</div>
                                {courier.vehicleDetails?.licensePlate && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                                        Bus Plate: <span className="font-medium text-gray-900">{courier.vehicleDetails.licensePlate}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {couriers.length === 0 && !isLoading && (
                        <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                            No couriers registered yet.
                        </div>
                    )}
                </div>
            )}

            {/* Add Shipment Modal */}
            {isShipmentModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-lg font-bold">New Shipment</h3>
                            <button onClick={() => setIsShipmentModalOpen(false)}><XMarkIcon className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleCreateShipment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Courier / Service</label>
                                <select
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                                    required
                                    value={newShipment.courierId || ''}
                                    onChange={e => setNewShipment({ ...newShipment, courierId: e.target.value })}
                                >
                                    <option value="">Select a courier...</option>
                                    {couriers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                                </select>
                            </div>
                            <InputField label="Tracking Number (Optional)" value={newShipment.trackingNumber || ''} onChange={e => setNewShipment({ ...newShipment, trackingNumber: e.target.value })} />

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Recipient Details</h4>
                                <div className="space-y-3">
                                    <InputField label="Name" required value={recipient.name} onChange={e => setRecipient({ ...recipient, name: e.target.value })} />
                                    <InputField label="Phone" required value={recipient.phone} onChange={e => setRecipient({ ...recipient, phone: e.target.value })} />
                                    <InputField label="Address / Destination" required value={recipient.address} onChange={e => setRecipient({ ...recipient, address: e.target.value })} />
                                </div>
                            </div>
                            <InputField label="Shipping Cost" type="number" required value={newShipment.shippingCost || 0} onChange={e => setNewShipment({ ...newShipment, shippingCost: parseFloat(e.target.value) })} />

                            <div className="mt-5 flex justify-end gap-3">
                                <Button variant="secondary" onClick={() => setIsShipmentModalOpen(false)}>Cancel</Button>
                                <Button type="submit">Create Shipment</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Courier Modal */}
            {isCourierModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-lg font-bold">Register Courier</h3>
                            <button onClick={() => setIsCourierModalOpen(false)}><XMarkIcon className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleCreateCourier} className="space-y-4">
                            <InputField label="Company / Driver Name" required value={newCourier.name || ''} onChange={e => setNewCourier({ ...newCourier, name: e.target.value })} />
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                                    value={newCourier.type}
                                    onChange={e => setNewCourier({ ...newCourier, type: e.target.value as any })}
                                >
                                    <option value="courier">Official Courier (DHL, FedEx)</option>
                                    <option value="bus">Bus Driver</option>
                                    <option value="private_fleet">Private Fleet</option>
                                </select>
                            </div>
                            <InputField label="Contact Person" value={newCourier.contactPerson || ''} onChange={e => setNewCourier({ ...newCourier, contactPerson: e.target.value })} />
                            <InputField label="Phone Number" value={newCourier.phone || ''} onChange={e => setNewCourier({ ...newCourier, phone: e.target.value })} />

                            {newCourier.type === 'bus' && (
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Bus Details</h4>
                                    <InputField
                                        label="License Plate"
                                        value={newCourier.vehicleDetails?.licensePlate || ''}
                                        onChange={e => setNewCourier({
                                            ...newCourier,
                                            vehicleDetails: { ...newCourier.vehicleDetails, licensePlate: e.target.value }
                                        })}
                                    />
                                </div>
                            )}

                            <div className="mt-5 flex justify-end gap-3">
                                <Button variant="secondary" onClick={() => setIsCourierModalOpen(false)}>Cancel</Button>
                                <Button type="submit">save Courier</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

