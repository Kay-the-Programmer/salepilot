import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User, StoreSettings, Customer, Product, Sale, BANK_ACCOUNT_FIELDS } from '../../types';
import { api, buildAssetUrl } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { Icon, Avatar } from '../crm/CrmBits';
import AppSwitcher from '../standalone/AppSwitcher';
import AppNavMenu from '../standalone/AppNavMenu';
import RailThemeButton from '../standalone/RailThemeButton';
import { useAppSwitcher } from '../../contexts/AppSwitcherContext';
import LoadingSpinner from '../LoadingSpinner';
import { useConfirm } from '../ui/useConfirm';
import Logo from '../../assets/logo.png';
import {
    DocStatus, DocType, DOC_ICON, DOC_LABEL, DOC_SINGULAR, DOC_TYPES, hasLineItems, isPriced,
    NEXT_STATUSES, SalesDocument, SalesDocumentItem, STATUS_LABEL,
} from './types';
import { downloadManualDocPdf, printManualDocPdf } from './manualDocPdf';
import { amountInWords, currencyUnits } from './amountInWords';
import { downloadDocumentPdf, printDocumentPdf } from './documentPdf';
import { announceLogoUpdate } from '../../utils/pdfDocument';
import '../crm/crm.css';
// Defines the `.sp-assistant` scope: both the --m3-* custom properties and the
// m3-* utility classes live there. Without this import the panels below have no
// background at all — same reason AccountingShell imports it.
import '../../pages/assistant/assistant.css';

interface SalesDocsAppProps {
    user: User;
    storeSettings: StoreSettings | null;
    customers: Customer[];
    products: Product[];
    onExit: () => void;
    onLogout: () => void;
}

const FIELD =
    'w-full px-3 py-2.5 rounded-lg text-sm font-medium m3-bg-surface-container m3-text-on-surface border m3-border-outline-variant focus:outline-none focus:ring-2 focus:ring-[color:var(--m3-primary)] focus:border-transparent transition-all';
const LABEL = 'block text-xs font-semibold m3-text-on-surface-variant mb-1.5';

const STATUS_TONE: Record<DocStatus, string> = {
    draft: 'bg-gray-500/15 text-gray-500',
    sent: 'bg-blue-500/15 text-blue-500',
    accepted: 'bg-emerald-500/15 text-emerald-600',
    declined: 'bg-red-500/15 text-red-500',
    expired: 'bg-amber-500/15 text-amber-600',
    converted: 'bg-[color:var(--m3-primary)]/15 text-[color:var(--m3-primary)]',
    cancelled: 'bg-gray-500/15 text-gray-400',
};

/** Stamp colour by status — the same rule the PDF stamp follows. */
const STAMP_TONE = (status: DocStatus) =>
    status === 'accepted' || status === 'converted' ? 'border-emerald-600 text-emerald-600'
        : status === 'declined' || status === 'cancelled' || status === 'expired' ? 'border-red-600 text-red-600'
            : 'border-[color:var(--m3-primary)] text-[color:var(--m3-primary)]';

const today = () => new Date().toISOString().slice(0, 10);
const emptyItem = (): SalesDocumentItem => ({ name: '', quantity: 1, unitPrice: 0 });

/**
 * Quotations & invoices.
 *
 * A document here is paperwork, not a ledger entry: creating or issuing one
 * changes no stock and posts nothing to the books. When the customer commits,
 * "Convert to sale" posts through the normal `/sales` endpoint — the single
 * place revenue, tax, COGS and stock are handled — and the document is then
 * linked to that sale. That keeps one definition of revenue across the app.
 */
export const SalesDocsApp: React.FC<SalesDocsAppProps> = ({
    user, storeSettings, customers, products, onExit, onLogout,
}) => {
    const { openAppSwitcher } = useAppSwitcher();
    const { confirm, confirmDialog } = useConfirm();

    const [tab, setTab] = useState<DocType>('quotation');
    const [docs, setDocs] = useState<SalesDocument[]>([]);
    const [selected, setSelected] = useState<SalesDocument | null>(null);
    const [editing, setEditing] = useState<SalesDocument | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const canDelete = user.role === 'admin' || user.role === 'superadmin';
    // Owners/admins manage the company logo that heads every document.
    const canBrand = canDelete;

    const [logoUrl, setLogoUrl] = useState<string>(storeSettings?.logoUrl || '');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    useEffect(() => { setLogoUrl(storeSettings?.logoUrl || ''); }, [storeSettings]);

    // The parent's copy of the settings can be a render behind an upload, so the
    // freshest logo is merged in here — it's what the PDF and preview both read.
    const settings = useMemo(
        () => (storeSettings ? ({ ...storeSettings, logoUrl } as StoreSettings) : storeSettings),
        [storeSettings, logoUrl],
    );

    const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploadingLogo(true);
        setError(null);
        try {
            const fd = new FormData();
            fd.append('logo', file);
            const r: any = await api.postFormData('/settings/logo', fd);
            setLogoUrl(r?.logoUrl || '');
            if (r?.logoUrl) announceLogoUpdate(r.logoUrl);
            setToast('Logo updated. It now heads your quotations and invoices.');
        } catch (err: any) {
            setError(err?.message || 'Could not upload the logo.');
        } finally {
            setUploadingLogo(false);
        }
    };

    const load = useCallback(async (type: DocType) => {
        try {
            const data = await api.get<{ items: SalesDocument[] }>(`/sales-documents?type=${type}&limit=100`);
            setDocs(data.items || []);
        } catch (e: any) {
            setError(e?.message || 'Could not load documents.');
        }
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await load(tab);
            setLoading(false);
        })();
    }, [tab, load]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return docs;
        return docs.filter(d =>
            d.number.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q));
    }, [docs, search]);

    const openDocument = async (id: string) => {
        try {
            setSelected(await api.get<SalesDocument>(`/sales-documents/${id}`));
        } catch (e: any) {
            setError(e?.message || 'Could not open the document.');
        }
    };

    const refreshAfterChange = async (id?: string) => {
        await load(tab);
        if (id) await openDocument(id);
    };

    const changeStatus = async (doc: SalesDocument, status: DocStatus) => {
        setBusy(true);
        try {
            await api.patch(`/sales-documents/${doc.id}/status`, { status });
            await refreshAfterChange(doc.id);
            setToast(`Marked ${STATUS_LABEL[status].toLowerCase()}`);
        } catch (e: any) {
            setError(e?.message || 'Could not update the document.');
        } finally {
            setBusy(false);
        }
    };

    const convertToInvoice = async (doc: SalesDocument) => {
        setBusy(true);
        try {
            const invoice = await api.post<SalesDocument>(`/sales-documents/${doc.id}/convert-to-invoice`, {});
            setTab('invoice');
            await load('invoice');
            await openDocument(invoice.id);
            setToast(`${doc.number} became ${invoice.number}`);
        } catch (e: any) {
            setError(e?.message || 'Could not convert the quotation.');
        } finally {
            setBusy(false);
        }
    };

    /**
     * Turn an invoice into a real sale.
     *
     * Two steps on purpose: the sale goes through `/sales` (stock, revenue, tax,
     * COGS, receivable) and then the document is linked to it. The transaction id
     * is derived from the document, so if the browser dies between the two calls
     * a retry hits the server's duplicate guard instead of recording the sale
     * twice — and the link step is idempotent.
     */
    const convertToSale = async (doc: SalesDocument) => {
        const ok = await confirm({
            title: `Convert ${doc.number} to a sale?`,
            message: 'This records the sale, reduces stock and posts to the books. '
                + 'The invoice becomes read-only afterwards.',
            confirmLabel: 'Convert to sale',
        });
        if (!ok) return;

        setBusy(true);
        setError(null);
        const transactionId = `doc-${doc.id}`;
        try {
            const cart = (doc.items || []).map(item => ({
                productId: item.productId || '',
                name: item.name,
                sku: item.sku || '',
                price: Number(item.unitPrice),
                quantity: Number(item.quantity),
            }));

            const payload: Partial<Sale> = {
                transactionId,
                timestamp: new Date().toISOString(),
                cart: cart as any,
                subtotal: Number(doc.subtotal),
                tax: Number(doc.tax),
                discount: Number(doc.discount),
                total: Number(doc.total),
                amountPaid: 0,
                paymentStatus: 'unpaid',
                customerId: doc.customerId || undefined,
                customerName: doc.customerName,
                dueDate: doc.validUntil || undefined,
            };

            try {
                await api.post('/sales', payload);
            } catch (e: any) {
                // 409 = this document's sale is already recorded (a retry after a
                // lost response). Fall through and link it.
                const already = /already exists/i.test(e?.message || '');
                if (!already) throw e;
            }

            await api.post(`/sales-documents/${doc.id}/link-sale`, { saleId: transactionId });
            await refreshAfterChange(doc.id);
            setToast('Sale recorded. It now appears in Receivables.');
        } catch (e: any) {
            setError(e?.message || 'Could not convert to a sale.');
        } finally {
            setBusy(false);
        }
    };

    const removeDocument = async (doc: SalesDocument) => {
        const ok = await confirm({
            title: `Delete ${doc.number}?`,
            message: 'This cannot be undone.',
            confirmLabel: 'Delete',
            danger: true,
        });
        if (!ok) return;
        setBusy(true);
        try {
            await api.delete(`/sales-documents/${doc.id}`);
            setSelected(null);
            await load(tab);
            setToast('Document deleted');
        } catch (e: any) {
            setError(e?.message || 'Could not delete the document.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="crm">
            <aside className="crm-rail" aria-label="Quotes and invoices navigation">
                <div className="crm-rail__brand">
                    <span className="crm-bar__logo"><Icon name="description" size={22} fill={1} /></span>
                    <div className="crm-rail__brand-text">
                        <span className="crm-rail__brand-title">SalePilot Documents</span>
                        <span className="crm-rail__brand-sub">Quotes &amp; Invoices</span>
                    </div>
                </div>

                <nav className="crm-rail__nav">
                    {DOC_TYPES.map(t => (
                        <button
                            key={t}
                            type="button"
                            className={`crm-rail__item${tab === t ? ' is-active' : ''}`}
                            aria-current={tab === t ? 'page' : undefined}
                            onClick={() => { setTab(t); setSelected(null); }}
                        >
                            <Icon name={DOC_ICON[t]} size={22} fill={tab === t ? 1 : 0} />
                            {DOC_LABEL[t]}
                        </button>
                    ))}
                </nav>

                <div className="crm-rail__foot">
                    <button type="button" className="crm-rail__item" onClick={openAppSwitcher}>
                        <Icon name="apps" size={22} /> SalePilot Apps
                    </button>
                    <RailThemeButton />
                    <button type="button" className="crm-rail__item crm-rail__item--logout" onClick={onLogout}>
                        <Icon name="logout" size={22} /> Logout
                    </button>
                    <div className="crm-rail__user">
                        <Avatar name={user?.name} src={user?.profilePicture} size={36} />
                        <div className="crm-rail__user-info">
                            <span className="crm-rail__user-name">{user?.name}</span>
                            <span className="crm-rail__user-role">{user?.role}</span>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="crm-body">
                <header className="crm-bar crm-bar--mobile">
                    <AppSwitcher user={user} currentRoute="quotes" triggerClassName="crm-iconbtn" />
                    <img src={Logo} alt="SalePilot" className="crm-bar__brandlogo" />
                    <div className="crm-bar__actions">
                        <AppNavMenu
                            items={[
                                { icon: 'request_quote', label: 'Quotations', active: tab === 'quotation', onClick: () => setTab('quotation') },
                                { icon: 'receipt_long', label: 'Invoices', active: tab === 'invoice', onClick: () => setTab('invoice') },
                            ]}
                            onExit={onExit}
                            onLogout={onLogout}
                            triggerClassName="crm-iconbtn"
                        />
                    </div>
                </header>

                {/* `sp-assistant` carries the --m3-* variables AND the m3-* utility
                    classes (pages/assistant/assistant.css) — both are scoped to it.
                    Without this wrapper every surface, border and text colour below
                    resolves to nothing and the panels render transparent. */}
                <main className="sp-assistant sp-docs p-4 sm:p-6 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-wrap items-center gap-3 mb-5">
                            <div className="flex-1 min-w-[200px]">
                                <h1 className="text-xl font-bold m3-text-on-surface">{DOC_LABEL[tab]}</h1>
                                <p className="text-sm m3-text-on-surface-variant mt-0.5">
                                    {tab === 'quotation'
                                        ? 'Price offers for customers. Nothing is sold until a quote is accepted and converted.'
                                        : tab === 'invoice'
                                            ? 'Bills for customers. Converting one records the sale and reduces stock.'
                                            : tab === 'delivery_note'
                                                ? 'Proof of goods handed over — quantities and descriptions, with signature lines. No prices.'
                                                : 'Acknowledges money received. A record for the customer; it does not post to your books.'}
                                </p>
                            </div>
                            {canBrand && (
                                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border m3-border-outline-variant cursor-pointer text-sm font-semibold m3-text-on-surface">
                                    {logoUrl ? (
                                        <img src={buildAssetUrl(logoUrl)} alt="Company logo"
                                            className="w-8 h-8 rounded object-contain m3-bg-surface-container" />
                                    ) : (
                                        <Icon name="add_photo_alternate" size={20} />
                                    )}
                                    <span>{uploadingLogo ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload company logo'}</span>
                                    <input type="file" accept="image/*" className="hidden"
                                        disabled={uploadingLogo} onChange={uploadLogo} />
                                </label>
                            )}
                            <input
                                className={`${FIELD} max-w-xs`}
                                placeholder="Search number or customer"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <button
                                type="button"
                                className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-[color:var(--m3-primary)]"
                                onClick={() => { setSelected(null); setEditing({ docType: tab } as SalesDocument); }}
                            >
                                New {DOC_SINGULAR[tab]}
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 text-red-500 text-sm flex items-start gap-2">
                                <Icon name="error" size={18} />
                                <span className="flex-1">{error}</span>
                                <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
                                    <Icon name="close" size={16} />
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center py-16"><LoadingSpinner /></div>
                        ) : visible.length === 0 ? (
                            <div className="rounded-2xl border m3-border-outline-variant m3-bg-surface-low py-16 text-center">
                                <Icon name={tab === 'quotation' ? 'request_quote' : 'receipt_long'} size={40} />
                                <p className="mt-3 text-sm font-semibold m3-text-on-surface">
                                    No {tab === 'quotation' ? 'quotations' : 'invoices'} yet
                                </p>
                                <p className="text-sm m3-text-on-surface-variant">
                                    Create one to send a customer a priced offer.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border m3-border-outline-variant m3-bg-surface-low overflow-hidden">
                                <ul className="divide-y divide-[color:var(--m3-outline-variant)]">
                                    {visible.map(doc => (
                                        <li key={doc.id}>
                                            <button
                                                type="button"
                                                className="w-full px-4 sm:px-5 py-3.5 flex items-center gap-3 text-left hover:m3-bg-surface-container transition-colors"
                                                onClick={() => openDocument(doc.id)}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold m3-text-on-surface truncate">
                                                        {doc.number} · {doc.customerName}
                                                    </p>
                                                    <p className="text-xs m3-text-on-surface-variant">
                                                        {new Date(doc.issueDate).toLocaleDateString()}
                                                        {doc.createdByName ? ` · ${doc.createdByName}` : ''}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_TONE[doc.status]}`}>
                                                    {STATUS_LABEL[doc.status]}
                                                </span>
                                                <span className="text-sm font-bold m3-text-on-surface whitespace-nowrap">
                                                    {formatCurrency(doc.total, settings!)}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {selected && !editing && (
                <DocumentDetail
                    doc={selected}
                    storeSettings={settings}
                    busy={busy}
                    canDelete={canDelete}
                    onClose={() => setSelected(null)}
                    onEdit={() => setEditing(selected)}
                    onStatus={status => changeStatus(selected, status)}
                    onConvertToInvoice={() => convertToInvoice(selected)}
                    onConvertToSale={() => convertToSale(selected)}
                    onDelete={() => removeDocument(selected)}
                />
            )}

            {editing && (
                <DocumentEditor
                    initial={editing}
                    docType={editing.docType || tab}
                    customers={customers}
                    products={products}
                    storeSettings={settings}
                    onCancel={() => setEditing(null)}
                    onSaved={async (saved) => {
                        setEditing(null);
                        setTab(saved.docType);
                        await load(saved.docType);
                        await openDocument(saved.id);
                        setToast(`${saved.number} saved`);
                    }}
                    onError={setError}
                />
            )}

            {confirmDialog}

            {toast && (
                <div className="sp-assistant fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[color:var(--m3-primary)] shadow-lg z-[60]">
                    {toast}
                </div>
            )}
        </div>
    );
};

// ──────────────────────────── Detail drawer ────────────────────────────

const DocumentDetail: React.FC<{
    doc: SalesDocument;
    storeSettings: StoreSettings | null;
    busy: boolean;
    canDelete: boolean;
    onClose: () => void;
    onEdit: () => void;
    onStatus: (s: DocStatus) => void;
    onConvertToInvoice: () => void;
    onConvertToSale: () => void;
    onDelete: () => void;
}> = ({ doc, storeSettings, busy, canDelete, onClose, onEdit, onStatus, onConvertToInvoice, onConvertToSale, onDelete }) => {
    const isQuote = doc.docType === 'quotation';
    // Bank accounts the store offers on invoices; the same filter the PDF applies.
    const invoiceBanks = (storeSettings?.bankAccounts || []).filter(b => b.showOnInvoices !== false);
    const next = NEXT_STATUSES[doc.status] || [];

    return (
        <div className="sp-assistant sp-docs fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
            <div
                className="w-full max-w-xl h-full overflow-y-auto m3-bg-surface shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 px-5 py-4 flex items-center gap-3 m3-bg-surface border-b m3-border-outline-variant">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base font-bold m3-text-on-surface truncate">
                            {doc.number} · {doc.customerName}
                        </h2>
                        <p className="text-xs m3-text-on-surface-variant">
                            {isQuote ? 'Quotation' : 'Invoice'} · {STATUS_LABEL[doc.status]}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close"><Icon name="close" size={20} /></button>
                </div>

                <div className="p-5">
                    {/* Mirrors the PDF header so what's on screen is what prints. */}
                    <div className="flex items-start gap-3 mb-4">
                        {storeSettings?.logoUrl && (
                            <img
                                src={buildAssetUrl(storeSettings.logoUrl)}
                                alt={`${storeSettings?.name || 'Company'} logo`}
                                className="w-14 h-14 rounded-lg object-contain m3-bg-surface-container"
                            />
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-bold m3-text-on-surface truncate">{storeSettings?.name || 'SalePilot'}</p>
                            {storeSettings?.address && <p className="text-xs m3-text-on-surface-variant truncate">{storeSettings.address}</p>}
                            {storeSettings?.phone && <p className="text-xs m3-text-on-surface-variant truncate">{storeSettings.phone}</p>}
                        </div>
                    </div>

                    <div className="rounded-xl border m3-border-outline-variant overflow-hidden mb-4">
                        <table className="w-full text-sm">
                            <thead className="bg-[color:var(--m3-primary)] text-white">
                                <tr>
                                    <th className="text-left px-3 py-2 font-semibold">Description</th>
                                    <th className="text-right px-3 py-2 font-semibold">Qty</th>
                                    <th className="text-right px-3 py-2 font-semibold">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[color:var(--m3-outline-variant)]">
                                {(doc.items || []).map((item, i) => (
                                    // Banded rows — every other line tinted, matching the PDF.
                                    <tr key={item.id || i} className={i % 2 === 1 ? 'm3-bg-surface-container' : ''}>
                                        <td className="px-3 py-2">
                                            {item.name}
                                            {item.sku && <span className="block text-xs m3-text-on-surface-variant">{item.sku}</span>}
                                        </td>
                                        <td className="px-3 py-2 text-right">{Number(item.quantity)}</td>
                                        <td className="px-3 py-2 text-right">{formatCurrency(Number(item.lineTotal), storeSettings!)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <dl className="text-sm space-y-1 mb-5">
                        <div className="flex justify-between"><dt className="m3-text-on-surface-variant">Subtotal</dt><dd>{formatCurrency(doc.subtotal, storeSettings!)}</dd></div>
                        {Number(doc.discount) > 0 && (
                            <div className="flex justify-between"><dt className="m3-text-on-surface-variant">Discount</dt><dd>- {formatCurrency(doc.discount, storeSettings!)}</dd></div>
                        )}
                        {Number(doc.tax) > 0 && (
                            <div className="flex justify-between"><dt className="m3-text-on-surface-variant">Tax ({Number(doc.taxRate)}%)</dt><dd>{formatCurrency(doc.tax, storeSettings!)}</dd></div>
                        )}
                        <div className="flex justify-between pt-2 border-t m3-border-outline-variant font-bold text-base">
                            <dt>Total</dt><dd>{formatCurrency(doc.total, storeSettings!)}</dd>
                        </div>
                    </dl>

                    {/* Bank details, exactly as the invoice prints them. */}
                    {doc.docType === 'invoice' && invoiceBanks.length > 0 && (
                        <div className="mb-5">
                            <p className="text-xs font-bold uppercase tracking-wide m3-text-on-surface-variant mb-2">Payment details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {invoiceBanks.map(bank => (
                                    <div key={bank.id} className="rounded-lg border m3-border-outline-variant px-3 py-2">
                                        <dl className="text-xs space-y-0.5">
                                            {BANK_ACCOUNT_FIELDS
                                                .map(f => ({ label: f.label, value: String(bank[f.key] ?? '').trim() }))
                                                .filter(r => r.value)
                                                .map(r => (
                                                    <div key={r.label} className="flex gap-2">
                                                        <dt className="m3-text-on-surface-variant w-28 shrink-0">{r.label}:</dt>
                                                        <dd className="font-semibold m3-text-on-surface break-all">{r.value}</dd>
                                                    </div>
                                                ))}
                                        </dl>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preview of the stamp that is drawn on the PDF. */}
                    <div className="flex justify-end mb-5">
                        <div className={`w-[190px] text-center rounded-lg border-2 p-1 ${STAMP_TONE(doc.status)}`}>
                            <div className="rounded border border-current/50 py-2 px-2">
                                <p className="text-[10px] font-bold uppercase tracking-wide truncate">{storeSettings?.name || 'SalePilot'}</p>
                                <p className="text-sm font-extrabold tracking-wider">{isQuote ? 'QUOTATION' : 'INVOICE'}</p>
                                <p className="text-[9px] font-semibold uppercase">Issued {new Date(doc.issueDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {doc.convertedSaleId && (
                        <p className="mb-4 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                            Recorded as a sale. It now appears under Receivables in the Accounting Hub.
                        </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <button type="button" className="px-3 py-2 rounded-lg text-sm font-semibold border m3-border-outline-variant"
                            onClick={() => { void (isPriced(doc.docType) ? downloadDocumentPdf(doc, storeSettings) : downloadManualDocPdf(doc, storeSettings)); }}>
                            <Icon name="download" size={16} /> PDF
                        </button>
                        <button type="button" className="px-3 py-2 rounded-lg text-sm font-semibold border m3-border-outline-variant"
                            onClick={() => { void (isPriced(doc.docType) ? printDocumentPdf(doc, storeSettings) : printManualDocPdf(doc, storeSettings)); }}>
                            <Icon name="print" size={16} /> Print
                        </button>
                        {doc.status === 'draft' && (
                            <button type="button" className="px-3 py-2 rounded-lg text-sm font-semibold border m3-border-outline-variant" onClick={onEdit}>
                                <Icon name="edit" size={16} /> Edit
                            </button>
                        )}
                        {next.map(status => (
                            <button
                                key={status}
                                type="button"
                                disabled={busy}
                                className="px-3 py-2 rounded-lg text-sm font-semibold border m3-border-outline-variant disabled:opacity-50"
                                onClick={() => onStatus(status)}
                            >
                                Mark {STATUS_LABEL[status].toLowerCase()}
                            </button>
                        ))}
                        {isQuote && (doc.status === 'accepted' || doc.status === 'sent') && (
                            <button type="button" disabled={busy}
                                className="px-3 py-2 rounded-lg text-sm font-bold text-white bg-[color:var(--m3-primary)] disabled:opacity-50"
                                onClick={onConvertToInvoice}>
                                Convert to invoice
                            </button>
                        )}
                        {/* Only an invoice becomes a sale. A delivery note and a
                            receipt are records of something that already happened. */}
                        {doc.docType === 'invoice' && doc.status !== 'converted' && doc.status !== 'cancelled' && (
                            <button type="button" disabled={busy}
                                className="px-3 py-2 rounded-lg text-sm font-bold text-white bg-[color:var(--m3-primary)] disabled:opacity-50"
                                onClick={onConvertToSale}>
                                Convert to sale
                            </button>
                        )}
                        {canDelete && doc.status !== 'converted' && (
                            <button type="button" disabled={busy}
                                className="px-3 py-2 rounded-lg text-sm font-semibold text-red-500 border border-red-500/40 disabled:opacity-50"
                                onClick={onDelete}>
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ──────────────────────────── Editor modal ────────────────────────────

const DocumentEditor: React.FC<{
    initial: SalesDocument;
    docType: DocType;
    customers: Customer[];
    products: Product[];
    storeSettings: StoreSettings | null;
    onCancel: () => void;
    onSaved: (doc: SalesDocument) => void;
    onError: (message: string) => void;
}> = ({ initial, docType, customers, products, storeSettings, onCancel, onSaved, onError }) => {
    const isEdit = !!initial.id;
    const [customerId, setCustomerId] = useState(initial.customerId || '');
    const [customerName, setCustomerName] = useState(initial.customerName || '');
    const [customerPhone, setCustomerPhone] = useState(initial.customerPhone || '');
    const [customerEmail, setCustomerEmail] = useState(initial.customerEmail || '');
    const [issueDate, setIssueDate] = useState(initial.issueDate || today());
    const [validUntil, setValidUntil] = useState(initial.validUntil || '');
    const [discount, setDiscount] = useState(String(initial.discount ?? 0));
    const [notes, setNotes] = useState(initial.notes || '');
    const [terms, setTerms] = useState(initial.terms || '');
    const [items, setItems] = useState<SalesDocumentItem[]>(
        initial.items?.length ? initial.items.map(i => ({ ...i })) : [emptyItem()],
    );
    const [saving, setSaving] = useState(false);

    // Receipt-only: the single figure acknowledged, and how it arrived.
    const [amount, setAmount] = useState(String(initial.total ?? ''));
    const [paymentMethod, setPaymentMethod] = useState<string>(initial.paymentMethod || 'cash');
    const [paymentReference, setPaymentReference] = useState(initial.paymentReference || '');
    // Delivery-note-only: the two people who sign the page.
    const [deliveredBy, setDeliveredBy] = useState(initial.deliveredBy || '');
    const [receivedBy, setReceivedBy] = useState(initial.receivedBy || '');

    // How a receipt can be paid comes from Settings → POS & checkout, so the
    // boxes ticked on the printed receipt are the store's own methods.
    const paymentOptions = useMemo(() => {
        const configured = (storeSettings?.paymentMethods || []).map(pm => pm.name).filter(Boolean);
        return configured.length ? configured : ['Cash', 'Cheque'];
    }, [storeSettings]);

    const isReceipt = docType === 'receipt';
    const isDeliveryNote = docType === 'delivery_note';
    const priced = isPriced(docType);

    const taxRate = Number(initial.taxRate ?? storeSettings?.taxRate ?? 0);

    // Mirrors the server's arithmetic so the operator sees the same figures the
    // backend will compute — the server's numbers are still authoritative.
    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
        const disc = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
        const tax = (subtotal - disc) * (taxRate / 100);
        return { subtotal, discount: disc, tax, total: subtotal - disc + tax };
    }, [items, discount, taxRate]);

    const setItem = (index: number, patch: Partial<SalesDocumentItem>) =>
        setItems(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

    const pickProduct = (index: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) { setItem(index, { productId: null }); return; }
        setItem(index, {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unitPrice: product.price,
        });
    };

    const valid = customerName.trim() !== '' && (
        isReceipt
            // A receipt needs one positive figure and nothing else.
            ? Number(amount) > 0
            : items.length > 0 && items.every(i =>
                i.name.trim() !== ''
                && Number(i.quantity) > 0
                // A delivery note carries no prices, so a blank one is fine.
                && (isDeliveryNote || Number(i.unitPrice) >= 0))
    );

    const save = async () => {
        if (!valid || saving) return;
        setSaving(true);
        try {
            const body = {
                docType,
                customerId: customerId || undefined,
                customerName: customerName.trim(),
                customerPhone: customerPhone || undefined,
                customerEmail: customerEmail || undefined,
                issueDate,
                validUntil: validUntil || undefined,
                discount: Number(discount) || 0,
                notes: notes || undefined,
                terms: terms || undefined,
                items: isReceipt ? [] : items.map(i => ({
                    productId: i.productId || undefined,
                    name: i.name.trim(),
                    sku: i.sku || undefined,
                    quantity: Number(i.quantity),
                    unitPrice: Number(i.unitPrice) || 0,
                })),
                ...(isReceipt ? {
                    amount: Number(amount),
                    paymentMethod,
                    paymentReference: paymentMethod.toLowerCase() === 'cash' ? undefined : (paymentReference || undefined),
                } : {}),
                ...(isDeliveryNote ? {
                    deliveredBy: deliveredBy || undefined,
                    receivedBy: receivedBy || undefined,
                } : {}),
            };
            const saved = isEdit
                ? await api.put<SalesDocument>(`/sales-documents/${initial.id}`, body)
                : await api.post<SalesDocument>('/sales-documents', body);
            onSaved(saved);
        } catch (e: any) {
            onError(e?.message || 'Could not save the document.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="sp-assistant sp-docs fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
            <div
                className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl m3-bg-surface shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between m3-bg-surface border-b m3-border-outline-variant">
                    <h2 className="text-base font-bold m3-text-on-surface">
                        {isEdit ? `Edit ${initial.number}` : `New ${DOC_SINGULAR[docType]}`}
                    </h2>
                    <button type="button" onClick={onCancel} aria-label="Close"><Icon name="close" size={20} /></button>
                </div>

                <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className={LABEL} htmlFor="doc-customer">Customer</label>
                            <select
                                id="doc-customer"
                                className={FIELD}
                                value={customerId}
                                onChange={e => {
                                    const id = e.target.value;
                                    setCustomerId(id);
                                    const c = customers.find(x => x.id === id);
                                    if (c) {
                                        setCustomerName(c.name);
                                        setCustomerPhone(c.phone || '');
                                        setCustomerEmail(c.email || '');
                                    }
                                }}
                            >
                                <option value="">Walk-in / not saved</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={LABEL} htmlFor="doc-name">Customer name</label>
                            <input id="doc-name" className={FIELD} value={customerName}
                                onChange={e => setCustomerName(e.target.value)} required />
                        </div>
                        <div>
                            <label className={LABEL} htmlFor="doc-phone">Phone</label>
                            <input id="doc-phone" className={FIELD} value={customerPhone}
                                onChange={e => setCustomerPhone(e.target.value)} />
                        </div>
                        <div>
                            <label className={LABEL} htmlFor="doc-email">Email</label>
                            <input id="doc-email" className={FIELD} value={customerEmail}
                                onChange={e => setCustomerEmail(e.target.value)} />
                        </div>
                        <div>
                            <label className={LABEL} htmlFor="doc-issued">Issue date</label>
                            <input id="doc-issued" type="date" className={FIELD} value={issueDate}
                                onChange={e => setIssueDate(e.target.value)} />
                        </div>
                        {priced && (
                            <div>
                                <label className={LABEL} htmlFor="doc-valid">
                                    {docType === 'quotation' ? 'Valid until' : 'Due date'}
                                </label>
                                <input id="doc-valid" type="date" className={FIELD} value={validUntil}
                                    onChange={e => setValidUntil(e.target.value)} />
                            </div>
                        )}
                    </div>

                    {/* A receipt has no line items — one figure, and how it was paid. */}
                    {isReceipt && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className={LABEL} htmlFor="doc-amount">Amount received</label>
                                <input
                                    id="doc-amount"
                                    className={FIELD}
                                    inputMode="decimal"
                                    value={amount}
                                    placeholder="0.00"
                                    onChange={e => setAmount(e.target.value)}
                                />
                                {Number(amount) > 0 && (
                                    <p className="text-xs m3-text-on-surface-variant mt-1">
                                        {amountInWords(
                                            Number(amount),
                                            currencyUnits(storeSettings?.currency?.code).major,
                                            currencyUnits(storeSettings?.currency?.code).minor,
                                        )}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className={LABEL} htmlFor="doc-method">Paid by</label>
                                <select id="doc-method" className={FIELD} value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}>
                                    {/* A saved receipt may name a method the store has since
                                        removed — keep it listed so editing doesn't silently
                                        change how it was paid. */}
                                    {(paymentOptions.some(o => o.toLowerCase() === paymentMethod.toLowerCase())
                                        ? paymentOptions
                                        : [paymentMethod, ...paymentOptions]).map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                </select>
                            </div>
                            {/* Cash needs no reference; everything else has one — a cheque
                                number, a mobile-money transaction id. */}
                            {paymentMethod.toLowerCase() !== 'cash' && (
                                <div>
                                    <label className={LABEL} htmlFor="doc-ref">Reference No.</label>
                                    <input id="doc-ref" className={FIELD} value={paymentReference}
                                        onChange={e => setPaymentReference(e.target.value)}
                                        placeholder="Cheque no. / transaction id" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Delivery notes are signed for on both sides. */}
                    {isDeliveryNote && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className={LABEL} htmlFor="doc-delivered-by">Delivered by</label>
                                <input id="doc-delivered-by" className={FIELD} value={deliveredBy}
                                    placeholder="Left blank prints a signature line"
                                    onChange={e => setDeliveredBy(e.target.value)} />
                            </div>
                            <div>
                                <label className={LABEL} htmlFor="doc-received-by">Received by</label>
                                <input id="doc-received-by" className={FIELD} value={receivedBy}
                                    placeholder="Usually signed on delivery"
                                    onChange={e => setReceivedBy(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {hasLineItems(docType) && (<>
                    <h3 className="text-sm font-bold m3-text-on-surface mb-2">
                        {isDeliveryNote ? "Goods delivered" : "Line items"}
                    </h3>
                    <div className="space-y-2 mb-3">
                        {items.map((item, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-12 sm:col-span-4">
                                    <label className={LABEL} htmlFor={`item-product-${i}`}>Product</label>
                                    <select
                                        id={`item-product-${i}`}
                                        className={FIELD}
                                        value={item.productId || ''}
                                        onChange={e => pickProduct(i, e.target.value)}
                                    >
                                        <option value="">Custom line</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-12 sm:col-span-3">
                                    <label className={LABEL} htmlFor={`item-name-${i}`}>Description</label>
                                    <input id={`item-name-${i}`} className={FIELD} value={item.name}
                                        onChange={e => setItem(i, { name: e.target.value })} />
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                    <label className={LABEL} htmlFor={`item-qty-${i}`}>Qty</label>
                                    <input id={`item-qty-${i}`} className={FIELD} inputMode="decimal" value={item.quantity}
                                        onChange={e => setItem(i, { quantity: e.target.value as any })} />
                                </div>
                                {priced && (
                                <div className="col-span-5 sm:col-span-2">
                                    <label className={LABEL} htmlFor={`item-price-`}>Unit price</label>
                                    <input id={`item-price-`} className={FIELD} inputMode="decimal" value={item.unitPrice}
                                        onChange={e => setItem(i, { unitPrice: e.target.value as any })} />
                                </div>
                                )}
                                <div className="col-span-3 sm:col-span-1 flex justify-end pb-1">
                                    <button
                                        type="button"
                                        aria-label={`Remove line ${i + 1}`}
                                        className="p-2 rounded-lg text-red-500 disabled:opacity-30"
                                        disabled={items.length === 1}
                                        onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                                    >
                                        <Icon name="delete" size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" className="text-sm font-semibold text-[color:var(--m3-primary)] mb-5"
                        onClick={() => setItems(prev => [...prev, emptyItem()])}>
                        + Add line
                    </button>
                    </>)}

                    {priced && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className={LABEL} htmlFor="doc-discount">Discount</label>
                            <input id="doc-discount" className={FIELD} inputMode="decimal" value={discount}
                                onChange={e => setDiscount(e.target.value)} />
                        </div>
                        <div className="rounded-lg m3-bg-surface-container px-3 py-2 text-sm">
                            <div className="flex justify-between"><span className="m3-text-on-surface-variant">Subtotal</span><span>{formatCurrency(totals.subtotal, storeSettings!)}</span></div>
                            {taxRate > 0 && (
                                <div className="flex justify-between"><span className="m3-text-on-surface-variant">Tax ({taxRate}%)</span><span>{formatCurrency(totals.tax, storeSettings!)}</span></div>
                            )}
                            <div className="flex justify-between font-bold mt-1 pt-1 border-t m3-border-outline-variant">
                                <span>Total</span><span>{formatCurrency(totals.total, storeSettings!)}</span>
                            </div>
                        </div>
                    </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        <div>
                            <label className={LABEL} htmlFor="doc-notes">
                                {isReceipt ? 'Being payment for' : 'Notes'}
                            </label>
                            <textarea id="doc-notes" className={FIELD} rows={2} value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder={isReceipt ? 'e.g. Part payment for INV-0004' : 'Shown on the document'} />
                        </div>
                        {priced && (
                            <div>
                                <label className={LABEL} htmlFor="doc-terms">Terms</label>
                                <textarea id="doc-terms" className={FIELD} rows={2} value={terms}
                                    onChange={e => setTerms(e.target.value)} placeholder="e.g. Payment within 14 days" />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button type="button" className="flex-1 py-2.5 rounded-lg text-sm font-semibold border m3-border-outline-variant"
                            onClick={onCancel}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!valid || saving}
                            className="flex-[2] py-2.5 rounded-lg text-sm font-bold text-white bg-[color:var(--m3-primary)] disabled:opacity-50"
                            onClick={save}
                        >
                            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create draft'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesDocsApp;
