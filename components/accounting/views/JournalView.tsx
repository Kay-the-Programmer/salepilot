import React, { useCallback, useEffect, useState } from 'react';
import { Account, StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import { getJournalPage, JournalPage, downloadCsv, niceDate } from '../booksApi';
import { usePeriod, PeriodPicker, Card, ExportButton, LoadState } from './booksUi';

/**
 * Every posting in the books, newest first, paged by the server so no period
 * is cut short. Pick an account to see only its postings with the balance
 * after each one (an account ledger).
 */

const PAGE = 50;

const SOURCE_LABEL: Record<string, string> = {
    sale: 'Sale', purchase: 'Purchase', payment: 'Payment', manual: 'Manual',
};
const sourceLabel = (s?: string) => (s && (SOURCE_LABEL[s] || s.replace(/_/g, ' '))) || '';

interface Props {
    accounts: Account[];
    storeSettings: StoreSettings;
}

const JournalView: React.FC<Props> = ({ accounts, storeSettings }) => {
    const money = (n: number) => formatCurrency(n, storeSettings);
    const period = usePeriod('this_month');
    const [accountId, setAccountId] = useState('');
    const [search, setSearch] = useState('');
    const [q, setQ] = useState('');
    const [offset, setOffset] = useState(0);
    const [data, setData] = useState<JournalPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Debounce the search box.
    useEffect(() => { const t = setTimeout(() => setQ(search.trim()), 300); return () => clearTimeout(t); }, [search]);
    // A new filter starts from the first page.
    useEffect(() => { setOffset(0); }, [period.from, period.to, accountId, q]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setData(await getJournalPage({ from: period.from, to: period.to, accountId: accountId || undefined, q: q || undefined, limit: PAGE, offset }));
        } catch (e: any) {
            setError(e?.message || 'Could not load the journal.');
        } finally {
            setLoading(false);
        }
    }, [period.from, period.to, accountId, q, offset]);
    useEffect(() => { load(); }, [load]);

    const exportCsv = async () => {
        // Whole filtered period, not just this page.
        // Whole filtered period, not just this page (the server pages at 200).
        const items: JournalPage['items'] = [];
        for (let off = 0; ; off += 200) {
            const p = await getJournalPage({ from: period.from, to: period.to, accountId: accountId || undefined, q: q || undefined, limit: 200, offset: off });
            items.push(...p.items);
            if (off + 200 >= p.total || p.items.length === 0) break;
        }
        const rows: (string | number)[][] = [['Date', 'Type', 'Description', 'Account', 'Debit', 'Credit']];
        for (const e of items) {
            for (const l of e.lines) {
                rows.push([e.date.slice(0, 10), sourceLabel(e.sourceType), e.description, l.accountName,
                    l.type === 'debit' ? l.amount : '', l.type === 'credit' ? l.amount : '']);
            }
        }
        downloadCsv(`journal_${period.from}_to_${period.to}.csv`, rows);
    };

    const sortedAccounts = [...accounts].sort((a, b) => a.number.localeCompare(b.number));
    const total = data?.total ?? 0;
    const ledger = !!data?.account;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold m3-text-on-surface">Journal</h3>
                    <p className="text-sm m3-text-on-surface-variant">Every money movement in your books. Each one adds up on both sides.</p>
                </div>
                <ExportButton onClick={exportCsv} disabled={!data || total === 0} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <PeriodPicker period={period} />
                <select
                    aria-label="Account"
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="px-3 py-2 text-sm rounded-xl border m3-border-outline-variant m3-bg-surface-lowest m3-text-on-surface"
                >
                    <option value="">All accounts</option>
                    {sortedAccounts.map(a => <option key={a.id} value={a.id}>{a.number} · {a.name}</option>)}
                </select>
                <input
                    type="search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search description…"
                    className="flex-1 min-w-[180px] px-3 py-2 text-sm rounded-xl border m3-border-outline-variant m3-bg-surface-lowest m3-text-on-surface"
                />
            </div>

            <LoadState loading={loading && !data} error={error} onRetry={load} />
            {data && !error && (
                <Card>
                    <div className="overflow-x-auto" style={{ opacity: loading ? 0.6 : 1 }}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide m3-text-on-surface-variant border-b m3-border-outline-variant">
                                    <th className="px-4 py-2 font-semibold whitespace-nowrap">Date</th>
                                    <th className="px-4 py-2 font-semibold">What happened</th>
                                    {ledger ? (
                                        <>
                                            <th className="px-4 py-2 font-semibold text-right">Change</th>
                                            <th className="px-4 py-2 font-semibold text-right">Balance after</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-4 py-2 font-semibold">Account</th>
                                            <th className="px-4 py-2 font-semibold text-right">Debit</th>
                                            <th className="px-4 py-2 font-semibold text-right">Credit</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map(e => {
                                    const head = (
                                        <>
                                            <td className="px-4 py-2 align-top whitespace-nowrap m3-text-on-surface-variant tabular-nums">{niceDate(e.date.slice(0, 10))}</td>
                                            <td className="px-4 py-2 align-top m3-text-on-surface">
                                                {sourceLabel(e.sourceType) && <span className="text-xs font-semibold m3-text-primary mr-2">{sourceLabel(e.sourceType)}</span>}
                                                {e.description}
                                            </td>
                                        </>
                                    );
                                    if (ledger) {
                                        const mv = e.accountMovement ?? 0;
                                        return (
                                            <tr key={e.id} className="border-b m3-border-outline-variant last:border-0">
                                                {head}
                                                <td className={`px-4 py-2 align-top text-right tabular-nums ${mv >= 0 ? 'text-green-700 dark:text-green-400' : 'm3-text-error'}`}>{mv >= 0 ? '+' : '−'}{money(Math.abs(mv))}</td>
                                                <td className="px-4 py-2 align-top text-right tabular-nums font-semibold m3-text-on-surface">{money(e.accountBalanceAfter ?? 0)}</td>
                                            </tr>
                                        );
                                    }
                                    return (
                                        <tr key={e.id} className="border-b m3-border-outline-variant last:border-0">
                                            {head}
                                            <td className="px-4 py-2 align-top m3-text-on-surface">
                                                {e.lines.map((l, i) => <div key={i} className={l.type === 'credit' ? 'pl-4' : ''}>{l.accountName}</div>)}
                                            </td>
                                            <td className="px-4 py-2 align-top text-right tabular-nums m3-text-on-surface">
                                                {e.lines.map((l, i) => <div key={i}>{l.type === 'debit' ? money(l.amount) : ' '}</div>)}
                                            </td>
                                            <td className="px-4 py-2 align-top text-right tabular-nums m3-text-on-surface">
                                                {e.lines.map((l, i) => <div key={i}>{l.type === 'credit' ? money(l.amount) : ' '}</div>)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {data.items.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center m3-text-on-surface-variant">Nothing recorded for these filters</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {total > 0 && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t m3-border-outline-variant text-sm m3-text-on-surface-variant">
                            <span>{offset + 1}–{Math.min(offset + PAGE, total)} of {total}</span>
                            <div className="flex gap-2">
                                <button disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE))}
                                    className="px-3 py-1.5 rounded-lg border m3-border-outline-variant font-semibold disabled:opacity-40">Newer</button>
                                <button disabled={offset + PAGE >= total || loading} onClick={() => setOffset(offset + PAGE)}
                                    className="px-3 py-1.5 rounded-lg border m3-border-outline-variant font-semibold disabled:opacity-40">Older</button>
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default JournalView;
