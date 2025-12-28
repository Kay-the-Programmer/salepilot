import React from 'react';
import { Supplier, Product } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import ShoppingCartIcon from '../icons/ShoppingCartIcon';
import { buildAssetUrl } from '@/services/api';

interface SupplierDetailViewProps {
    supplier: Supplier;
    products: Product[];
    onEdit: (supplier: Supplier) => void;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-50 p-4 rounded-md shadow">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h3>
        {children}
    </div>
);

const SupplierDetailView: React.FC<SupplierDetailViewProps> = ({ supplier, products, onEdit }) => {
    return (
        <div className="p-4 sm:p-4 lg:p-4 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <InfoCard title="Supplier Details">
                        <div className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Supplier Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{supplier.name}</dd>
                            </div>
                             <div>
                                <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                                <dd className="mt-1 text-sm text-gray-900">{supplier.contactPerson || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                                <dd className="mt-1 text-sm text-gray-900">{supplier.email || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                <dd className="mt-1 text-sm text-gray-900">{supplier.phone || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Address</dt>
                                <dd className="mt-1 text-sm text-gray-900">{supplier.address || 'N/A'}</dd>
                            </div>
                             <div>
                                <dt className="text-sm font-medium text-gray-500">Payment Terms</dt>
                                <dd className="mt-1 text-sm text-gray-900">{supplier.paymentTerms || 'N/A'}</dd>
                            </div>
                             <div>
                                <dt className="text-sm font-medium text-gray-500">Banking Details</dt>
                                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{supplier.bankingDetails || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{supplier.notes || 'None'}</dd>
                            </div>
                        </div>
                        <button
                            onClick={() => onEdit(supplier)}
                            className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <PencilIcon className="w-5 h-5 mr-2 -ml-1" />
                            Edit Supplier
                        </button>
                    </InfoCard>
                </div>
                <div className="lg:col-span-2">
                    <InfoCard title="Products from this Supplier">
                        {products.length > 0 ? (
                            <ul role="list" className="divide-y divide-gray-200 -mt-4">
                                {products.map((product) => (
                                    <li key={product.id} className="py-4 flex items-center">
                                        {product.imageUrls[0] ? (
                                            <img className="h-10 w-10 rounded-full object-cover" src={buildAssetUrl(product.imageUrls[0])} alt={product.name} />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                                <ShoppingCartIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-gray-500">{product.sku}</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-sm text-gray-900">{product.stock} in stock</p>
                                             <p className="text-sm text-gray-500">${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">There are no products currently linked to this supplier.</p>
                        )}
                    </InfoCard>
                </div>
            </div>
        </div>
    );
};

export default SupplierDetailView;