import React, { useState } from 'react';
import { Shipment } from '../types';
import { PlusIcon, SearchIcon, TruckIcon, CameraIcon, XMarkIcon } from '../components/icons/index';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';

const MOCK_SHIPMENTS: Shipment[] = [
    {
        id: '1',
        trackingNumber: 'TRK123456789',
        shippingCompany: 'DHL',
        status: 'in_transit',
        contactName: 'John Doe',
        contactPhone: '555-0123',
        createdAt: new Date().toISOString(),
    },
    {
        id: '2',
        trackingNumber: 'TRK987654321',
        shippingCompany: 'FedEx',
        status: 'delivered',
        contactName: 'Jane Smith',
        contactPhone: '555-0456',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
    }
];

export default function LogisticsPage() {
    const [shipments, setShipments] = useState<Shipment[]>(MOCK_SHIPMENTS);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newShipment, setNewShipment] = useState<Partial<Shipment>>({
        shippingCompany: 'DHL',
        status: 'pending'
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const filteredShipments = shipments.filter(s =>
        s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.contactName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenModal = () => {
        setNewShipment({ shippingCompany: 'DHL', status: 'pending' });
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewShipment(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewShipment(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const shipment: Shipment = {
            id: Date.now().toString(),
            trackingNumber: newShipment.trackingNumber || '',
            shippingCompany: newShipment.shippingCompany || 'DHL',
            status: 'pending',
            contactName: newShipment.contactName || '',
            contactPhone: newShipment.contactPhone,
            contactEmail: newShipment.contactEmail,
            createdAt: new Date().toISOString(),
            parcelImageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined
        };

        setShipments(prev => [shipment, ...prev]);
        handleCloseModal();
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
                        <h1 className="text-2xl font-bold text-gray-900">Logistics Management</h1>
                        <p className="text-sm text-gray-500">Track and manage your shipments</p>
                    </div>
                </div>
                <Button onClick={handleOpenModal} icon={<PlusIcon className="w-5 h-5" />}>
                    New Shipment
                </Button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search by tracking number or contact..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Shipments List */}
            <div className="flex-1 overflow-auto bg-white rounded-lg shadow border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking Number</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcel</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredShipments.length === 0 ? (
                             <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No shipments found.
                                </td>
                            </tr>
                        ) : (
                            filteredShipments.map((shipment) => (
                                <tr key={shipment.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {shipment.trackingNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {shipment.shippingCompany}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="font-medium text-gray-900">{shipment.contactName}</div>
                                        <div>{shipment.contactPhone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(shipment.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                            ${shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                              shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                                              shipment.status === 'returned' ? 'bg-red-100 text-red-800' :
                                              'bg-yellow-100 text-yellow-800'}`}>
                                            {shipment.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {shipment.parcelImageUrl ? (
                                            <a href={shipment.parcelImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                <CameraIcon className="w-4 h-4" /> View
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">No Image</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleCloseModal}></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Shipment</h3>
                                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                                                <XMarkIcon className="w-6 h-6" />
                                            </button>
                                        </div>
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Shipping Company</label>
                                                <select
                                                    name="shippingCompany"
                                                    value={newShipment.shippingCompany}
                                                    onChange={handleSelectChange}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                                                >
                                                    <option value="DHL">DHL</option>
                                                    <option value="FedEx">FedEx</option>
                                                    <option value="UPS">UPS</option>
                                                    <option value="USPS">USPS</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <InputField
                                                label="Tracking Number"
                                                name="trackingNumber"
                                                value={newShipment.trackingNumber || ''}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g. 123456789"
                                            />
                                            <InputField
                                                label="Contact Name"
                                                name="contactName"
                                                value={newShipment.contactName || ''}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g. John Doe"
                                            />
                                            <InputField
                                                label="Contact Phone"
                                                name="contactPhone"
                                                value={newShipment.contactPhone || ''}
                                                onChange={handleInputChange}
                                                placeholder="e.g. +1 555 123 4567"
                                            />
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Parcel Image</label>
                                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                                    <div className="space-y-1 text-center">
                                                        <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                        <div className="flex text-sm text-gray-600">
                                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                                <span>Upload a file</span>
                                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                                                            </label>
                                                            <p className="pl-1">or drag and drop</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                                        {imageFile && <p className="text-sm text-green-600">{imageFile.name}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                <Button type="submit" className="w-full sm:ml-3 sm:w-auto">
                                                    Save Shipment
                                                </Button>
                                                <Button variant="secondary" onClick={handleCloseModal} className="mt-3 w-full sm:mt-0 sm:w-auto">
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
