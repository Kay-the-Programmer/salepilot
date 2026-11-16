import React, { useCallback, useEffect, useState } from 'react';
import { StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import { getTaxReport, TaxReport, downloadCsv, niceDate } from '../booksApi';
import { usePeriod, PeriodPicker, Card, Row, ExportButton, LoadState } from './booksUi';

/**
 * VAT for a period, the way the return is filled in:
 *   VAT charged on sales (by tax class)
 * − VAT given back on refunds
 * − VAT paid on stock you bought (recoverable)
 * = VAT to pay
 * Computed by the server from every sale, refund and supplier bill in the period.
 */

const CLASS_LABEL: Record<string, string> = {
    standard: 'Standard-rated sales',
    zero: 'Zero-rated sales',
    exempt: 'Exempt sales',
};

const TaxReportView: React.FC<{ storeSettings: StoreSettings }> = ({ storeSettings }) => {
    const money = (n: number) => formatCurrency(n, storeSettings);
    const period = usePeriod('last_month');
    const [data, setData] = useState<TaxReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setData(await getTaxReport(period.from, period.to));
        } catch (e: any) {
            setError(e?.message || 'Could not load the VAT report.');
        } finally {
            setLoading(false);
        }
    }, [period.from, period.to]);
    useEffect(() => { load(); }, [load]);

    const exportCsv = () => {
        if (!data) return;
        downloadCsv(`vat_${period.from}_to_${period.to}.csv`, [
            ['VAT report', `${period.from} to ${period.to}`],
            ['Line', 'Sales (excl. VAT)', 'VAT'],
            ...data.output.map(o => [`${CLASS_LABEL[o.taxClass] || o.taxClass}${o.taxClass === 'standard' && o.ratePct ? ` (${o.ratePct}%)` : ''}`, o.net, o.tax]),
            ['VAT charged on sales', '', data.outputTax],
            ['Less: VAT refunded to customers', data.refundsNet, -data.refundsTax],
            ['Less: VAT paid on purchases', '', -data.inputTax],
            [data.netPayable >= 0 ? 'VAT to pay' : 'VAT to reclaim', '', data.netPayable],
        ]);
    };

    const owe = (data?.netPayable ?? 0) >= 0;
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold m3-text-on-surface">VAT</h3>
                <div className="flex flex-wrap items-center gap-2">
                    <PeriodPicker period={period} />
                    <ExportButton onClick={exportCsv} disabled={!data || loading} />
                </div>
            </div>

            <LoadState loading={loading && !data} error={error} onRetry={load} />
            {data && !error && (
                <div className="grid gap-4 lg:grid-cols-[1fr_320px]" style={{ opacity: loading ? 0.6 : 1 }}>
                    <Card>
                        <Row label="Sales" value="VAT" muted />
                        {data.output.length === 0 && <div className="px-4 py-3 text-sm m3-text-on-surface-variant">No sales in this period</div>}
                        {data.output.map(o => (
                            <Row
                                key={o.taxClass}
                                label={`${CLASS_LABEL[o.taxClass] || o.taxClass}${o.taxClass === 'standard' && o.ratePct ? ` (${o.ratePct}%)` : ''}`}
                                hint={`${money(o.net)} before VAT`}
                                value={money(o.tax)}
                            />
                        ))}
                        <Row label="VAT charged on sales" value={money(data.outputTax)} strong />
                        <Row label="Less: VAT refunded to customers" hint={data.refundsNet ? `On ${money(data.refundsNet)} of refunds` : undefined} value={`− ${money(data.refundsTax)}`} />
                        <Row label="Less: VAT paid on purchases" hint="From supplier bills that show VAT" value={`− ${money(data.inputTax)}`} />
                        <Row label={owe ? 'VAT to pay' : 'VAT to reclaim'} value={money(Math.abs(data.netPayable))} strong />
                    </Card>
                    <div className="space-y-4">
                        <div className={`rounded-2xl p-5 border ${owe ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800' : 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800'}`}>
                            <div className="text-sm font-semibold m3-text-on-surface-variant">{owe ? 'VAT to pay' : 'VAT to reclaim'}</div>
                            <div className="text-3xl font-bold tabular-nums m3-text-on-surface">{money(Math.abs(data.netPayable))}</div>
                            <div className="text-xs m3-text-on-surface-variant mt-1">
                                {niceDate(period.from)} – {niceDate(period.to)} · {data.salesCount} sale{data.salesCount === 1 ? '' : 's'}
                            </div>
                        </div>
                        <p className="text-xs m3-text-on-surface-variant px-1">
                            Cancelled sales are left out. Once you have filed this return, close the period under Reports so these figures can't change.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaxReportView;
