import React, { useEffect, useState } from 'react';
import { Building2, Plus, Check, ArrowRightLeft, ShieldCheck, ShieldAlert, LayoutGrid, LogOut, Store, X } from 'lucide-react';
import { StoreSettings, User } from '../../types';
import { getMyStores, switchStore, registerStoreAndRefreshUser, MyStore } from '../../services/storesService';
import { setStoredCurrentStore } from '../../services/authService';

interface MultiStoreAppProps {
    user: User;
    storeSettings: StoreSettings | null;
    onDiscover: () => void;
    onLogout: () => void;
    showSnackbar: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const card = 'bg-surface border border-brand-border rounded-2xl shadow-sm';
const btn = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
const btnPrimary = `${btn} bg-sp-amber text-white hover:bg-sp-green-dark`;
const btnGhost = `${btn} bg-surface-variant text-brand-text hover:brightness-95`;
const input = 'w-full px-4 py-2.5 rounded-xl border border-brand-border bg-surface-container-lowest text-brand-text focus:ring-2 focus:ring-sp-green/30 focus:border-sp-green outline-none';

const statusPill = (s?: string) => {
    const v = (s || '').toLowerCase();
    if (v === 'active') return 'bg-success-muted text-success';
    if (v === 'trial') return 'bg-sp-amber-soft text-sp-amber';
    if (v === 'past_due' || v === 'suspended') return 'bg-danger-muted text-danger';
    return 'bg-surface-variant text-brand-text-muted';
};

export const MultiStoreApp: React.FC<MultiStoreAppProps> = ({ onDiscover, onLogout, showSnackbar }) => {
    const [stores, setStores] = useState<MyStore[]>([]);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: '', type: '', phone: '', address: '' });

    const load = () => {
        setLoading(true);
        getMyStores().then(setStores).catch(() => showSnackbar('Could not load your businesses.', 'error')).finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const doSwitch = async (s: MyStore) => {
        if (s.isCurrent) return;
        setSwitching(s.id);
        try {
            await switchStore(s.id);
            setStoredCurrentStore(s.id);
            showSnackbar(`Switched to ${s.name}.`, 'success');
            // Reload so every store-scoped screen re-fetches for the new business.
            setTimeout(() => window.location.assign('/'), 400);
        } catch (e: any) {
            showSnackbar(e?.message || 'Could not switch business.', 'error');
            setSwitching(null);
        }
    };

    const create = async () => {
        if (form.name.trim().length < 2) { showSnackbar('Enter a business name (min 2 characters).', 'error'); return; }
        setCreating(true);
        try {
            const { store } = await registerStoreAndRefreshUser(form.name.trim(), form.type.trim() ? [form.type.trim()] : [], form.phone.trim() || undefined, form.address.trim() || undefined);
            setStoredCurrentStore(store.id); // backend makes the new store active
            showSnackbar(`${store.name} created and set as your active business.`, 'success');
            setForm({ name: '', type: '', phone: '', address: '' });
            setShowForm(false);
            load();
        } catch (e: any) {
            showSnackbar(e?.message || 'Could not create the business.', 'error');
        } finally { setCreating(false); }
    };

    const current = stores.find(s => s.isCurrent);
    const others = stores.filter(s => !s.isCurrent);

    return (
        <div className="h-full flex flex-col bg-background overflow-hidden">
            <header className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-brand-border bg-surface shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-sp-green rounded-lg text-white shrink-0"><Building2 className="w-5 h-5" /></div>
                    <div className="min-w-0">
                        <h1 className="text-lg font-extrabold tracking-tight text-brand-text leading-tight">My Businesses</h1>
                        <p className="text-xs text-brand-text-muted truncate">{stores.length} business{stores.length === 1 ? '' : 'es'} · manage them all in one place</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className={btnGhost} onClick={onDiscover} title="Discover apps"><LayoutGrid className="w-4 h-4" /></button>
                    <button className={btnGhost} onClick={onLogout} title="Logout"><LogOut className="w-4 h-4" /></button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-3xl mx-auto grid grid-cols-1 gap-5">
                    {/* Active business */}
                    {current && (
                        <div className={`${card} p-6 ring-2 ring-sp-green/30`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-xl bg-sp-green-soft text-sp-green flex items-center justify-center shrink-0"><Store className="w-6 h-6" /></div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base font-extrabold text-brand-text truncate">{current.name}</h2>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sp-amber text-white"><Check className="w-3 h-3" /> Active</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-brand-text-muted">
                                            <span className={`px-2 py-0.5 rounded-full font-bold ${statusPill(current.subscriptionStatus)}`}>{current.subscriptionStatus || current.status}</span>
                                            {current.isVerified ? <span className="inline-flex items-center gap-1 text-success"><ShieldCheck className="w-3.5 h-3.5" /> Verified</span> : <span className="inline-flex items-center gap-1 text-sp-amber"><ShieldAlert className="w-3.5 h-3.5" /> Unverified</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Other businesses */}
                    {loading ? (
                        <div className={`${card} p-6 text-center text-sm text-brand-text-muted`}>Loading your businesses…</div>
                    ) : others.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-brand-text-muted px-1">Switch business</p>
                            {others.map(s => (
                                <div key={s.id} className={`${card} p-4 flex items-center justify-between gap-3`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-surface-variant text-brand-text-muted flex items-center justify-center shrink-0"><Store className="w-5 h-5" /></div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-brand-text truncate">{s.name}</p>
                                            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${statusPill(s.subscriptionStatus)}`}>{s.subscriptionStatus || s.status}</span>
                                        </div>
                                    </div>
                                    <button className={btnGhost} disabled={switching === s.id} onClick={() => doSwitch(s)}>
                                        <ArrowRightLeft className="w-4 h-4" /> {switching === s.id ? 'Switching…' : 'Switch'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add a business */}
                    {showForm ? (
                        <div className={`${card} p-6`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-extrabold text-brand-text">Register a new business</h2>
                                <button className="p-1.5 rounded-lg hover:bg-surface-variant text-brand-text-muted" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-3">
                                <label className="block">
                                    <span className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1.5">Business name *</span>
                                    <input className={input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Downtown Branch" />
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className="block">
                                        <span className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1.5">Type (optional)</span>
                                        <input className={input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="Retail, Restaurant…" />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1.5">Phone (optional)</span>
                                        <input className={input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+260…" />
                                    </label>
                                </div>
                                <label className="block">
                                    <span className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1.5">Address (optional)</span>
                                    <input className={input} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street, City" />
                                </label>
                            </div>
                            <p className="text-xs text-brand-text-muted mt-3">The new business starts on a trial and becomes your active store. You can switch back any time.</p>
                            <button className={`${btnPrimary} w-full mt-4 py-3`} disabled={creating} onClick={create}>
                                <Plus className="w-4 h-4" /> {creating ? 'Creating…' : 'Create business'}
                            </button>
                        </div>
                    ) : (
                        <button className={`${card} p-5 flex items-center gap-3 text-left hover:border-sp-green hover:shadow-md transition-all`} onClick={() => setShowForm(true)}>
                            <div className="w-10 h-10 rounded-xl bg-sp-green-soft text-sp-green flex items-center justify-center shrink-0"><Plus className="w-5 h-5" /></div>
                            <div>
                                <p className="font-bold text-brand-text">Register another business</p>
                                <p className="text-sm text-brand-text-muted">Run multiple shops or entities from one account.</p>
                            </div>
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MultiStoreApp;
