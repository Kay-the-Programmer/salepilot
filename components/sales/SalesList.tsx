import React from 'react';
import { Sale, StoreSettings } from '@/types';
import { formatCurrency } from '@/utils/currency';
import UnifiedListGrid from '../ui/UnifiedListGrid';
import { StandardCard, StandardRow } from '../ui/standard';

interface SalesListProps {
    sales: Sale[];
    onSelectSale: (sale: Sale) => void;
    storeSettings: StoreSettings;
    viewMode?: 'grid' | 'list';
    selectedSaleId?: string;
}

const PaymentStatusBadge: React.FC<{ status: Sale['paymentStatus'] | Sale['refundStatus'] }> = ({ status }) => {
    const statusConfig = {
        paid: {
            color: 'border-emerald-200 text-emerald-700 bg-emerald-50',
            label: 'Paid'
        },
        unpaid: {
            color: 'border-red-200 text-red-700 bg-red-50',
            label: 'Unpaid'
        },
        partially_paid: {
            color: 'border-amber-200 text-amber-700 bg-amber-50',
            label: 'Partial'
        },
        returned: {
            color: 'border-slate-200 text-slate-700 bg-slate-50',
            label: 'Returned'
        },
        partially_returned: {
            color: 'border-orange-200 text-orange-700 bg-orange-50',
            label: 'Returned (Partial)'
        },
        fully_refunded: {
            color: 'border-slate-200 text-slate-700 bg-slate-50',
            label: 'Refunded'
        },
        partially_refunded: {
            color: 'border-orange-200 text-orange-700 bg-orange-50',
            label: 'Refunded (Partial)'
        },
        none: {
            color: 'border-slate-200 text-slate-600 bg-slate-50',
            label: 'Draft'
        }
    };

    if (!status) return null;
    const config = statusConfig[status] || statusConfig.unpaid;

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.color}`}>
            {config.label}
        </span>
    );
};

const SalesList: React.FC<SalesListProps> = ({ sales, onSelectSale, storeSettings, viewMode = 'list', selectedSaleId }) => {

    const getSaleDerivedStatus = (sale: Sale) => {
        const calculatedAmountPaid = sale.amountPaid;
        const balanceDue = Math.max(0, sale.total - calculatedAmountPaid);
        let derivedStatus: string = sale.paymentStatus;

        if (sale.refundStatus && sale.refundStatus !== 'none') {
            derivedStatus = sale.refundStatus;
        } else if (balanceDue <= 0.01) {
            derivedStatus = 'paid';
        } else if (calculatedAmountPaid > 0) {
            derivedStatus = 'partially_paid';
        } else if (sale.paymentStatus === 'paid' && balanceDue > 0.01) {
            derivedStatus = 'partially_paid';
        }
        return derivedStatus;
    };

    return (
        <div className="flex flex-col h-full">
            <UnifiedListGrid<Sale>
                items={sales}
                viewMode={viewMode}
                isLoading={false}
                emptyMessage="No sales match your current filters."
                getItemId={(sale) => sale.transactionId}
                onItemClick={onSelectSale}
                selectedId={selectedSaleId}
                className="flex-1"
                listClassName="space-y-0 divide-y divide-slate-100 dark:divide-white/5"
                renderGridItem={(sale, _, isSelected) => {
                    const derivedStatus = getSaleDerivedStatus(sale);
                    return (
                        <StandardCard
                            title={sale.customerName || 'Walk-in Customer'}
                            subtitle={`${new Date(sale.timestamp).toLocaleDateString()} • ${new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            isSelected={isSelected}
                            onClick={() => onSelectSale(sale)}
                            image={
                                <div className="w-full h-full bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-gray-500 flex items-center justify-center font-bold text-xs group-hover:bg-blue-50 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors active:scale-95 transition-all duration-300">
                                    #{sale.transactionId.slice(-4)}
                                </div>
                            }
                            status={<PaymentStatusBadge status={derivedStatus as any} />}
                            primaryInfo={formatCurrency(sale.total, storeSettings)}
                            secondaryInfo={
                                <div className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                                    {sale.itemsCount || sale.cart?.length || 0} items
                                </div>
                            }
                        />
                    );
                }}
                renderListItem={(sale, _, isSelected) => {
                    const derivedStatus = getSaleDerivedStatus(sale);
                    const calculatedAmountPaid = sale.amountPaid;
                    const paymentPercentage = calculatedAmountPaid > 0 ? (calculatedAmountPaid / sale.total) * 100 : 0;

                    return (
                        <StandardRow
                            title={sale.customerName || 'Walk-in Customer'}
                            subtitle={`${new Date(sale.timestamp).toLocaleDateString()} • ${new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            isSelected={isSelected}
                            onClick={() => onSelectSale(sale)}
                            leading={
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-gray-500 flex items-center justify-center font-bold text-xs group-hover:bg-blue-50 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0 active:scale-95 transition-all duration-300">
                                    #{sale.transactionId.slice(-4)}
                                </div>
                            }
                            status={<PaymentStatusBadge status={derivedStatus as any} />}
                            primaryMeta={formatCurrency(sale.total, storeSettings)}
                            details={[
                                <span className="text-xs text-slate-500 dark:text-gray-400 font-medium" key="count">
                                    {sale.itemsCount || sale.cart?.length || 0} items
                                </span>,
                                (derivedStatus === 'partially_paid' && (
                                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden ml-2" key="progress">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${paymentPercentage}%` }}
                                        />
                                    </div>
                                ))
                            ]}
                        />
                    );
                }}
            />
        </div>
    );
};

export default SalesList;