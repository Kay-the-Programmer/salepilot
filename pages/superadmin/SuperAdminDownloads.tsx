import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../components/ui/useConfirm';
import {
    DesktopRelease, ReleaseChannel, ReleasePlatform,
    listAllReleases, uploadRelease, updateRelease, deleteRelease,
    downloadRelease, formatBytes,
} from '../../services/releasesService';

const PLATFORMS: { id: ReleasePlatform; label: string }[] = [
    { id: 'windows', label: 'Windows' },
    { id: 'mac', label: 'macOS' },
    { id: 'linux', label: 'Linux' },
];

const CHANNELS: { id: ReleaseChannel; label: string }[] = [
    { id: 'stable', label: 'Stable' },
    { id: 'beta', label: 'Beta' },
];

const INPUT = 'w-full px-3 py-2 rounded-lg border border-brand-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40';

/**
 * Super Admin — desktop app releases.
 *
 * Upload an installer, then publish it. Uploads land unpublished so a bad build
 * is never visible to users, and publishing one release automatically retires
 * the previous one on that platform+channel (enforced server-side).
 */
const SuperAdminDownloads: React.FC = () => {
    const { showToast } = useToast();
    const { confirm, confirmDialog } = useConfirm();

    const [releases, setReleases] = useState<DesktopRelease[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [version, setVersion] = useState('');
    const [platform, setPlatform] = useState<ReleasePlatform>('windows');
    const [channel, setChannel] = useState<ReleaseChannel>('stable');
    const [notes, setNotes] = useState('');
    const [uploadPct, setUploadPct] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = async () => {
        setLoading(true);
        try {
            setReleases(await listAllReleases());
        } catch (e: any) {
            showToast(e?.message || 'Failed to load releases', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

    const resetForm = () => {
        setFile(null);
        setVersion('');
        setNotes('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return showToast('Choose an installer file first', 'error');
        if (!version.trim()) return showToast('Enter a version number', 'error');

        setUploadPct(0);
        try {
            const created = await uploadRelease(file, { version: version.trim(), platform, channel, notes }, setUploadPct);
            setReleases(prev => [created, ...prev]);
            resetForm();
            showToast(`Uploaded ${created.version}. Publish it when you are ready.`, 'success');
        } catch (err: any) {
            showToast(err?.message || 'Upload failed', 'error');
        } finally {
            setUploadPct(null);
        }
    };

    const togglePublish = async (r: DesktopRelease) => {
        setBusyId(r.id);
        try {
            const updated = await updateRelease(r.id, { isPublished: !r.isPublished });
            // Publishing retires the previous build on the same platform+channel,
            // so mirror that locally rather than showing two "live" rows.
            setReleases(prev => prev.map(item => {
                if (item.id === updated.id) return updated;
                if (updated.isPublished && item.platform === updated.platform && item.channel === updated.channel) {
                    return { ...item, isPublished: false };
                }
                return item;
            }));
            showToast(updated.isPublished ? `${updated.version} is now live` : `${updated.version} unpublished`, 'success');
        } catch (e: any) {
            showToast(e?.message || 'Update failed', 'error');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (r: DesktopRelease) => {
        const ok = await confirm({
            title: `Delete ${r.platform} ${r.version}?`,
            message: 'The installer file is removed from the server permanently. Anyone with the download page open will get an error.',
            confirmLabel: 'Delete release',
            danger: true,
        });
        if (!ok) return;

        setBusyId(r.id);
        try {
            await deleteRelease(r.id);
            setReleases(prev => prev.filter(item => item.id !== r.id));
            showToast('Release deleted', 'success');
        } catch (e: any) {
            showToast(e?.message || 'Delete failed', 'error');
        } finally {
            setBusyId(null);
        }
    };

    const handleTestDownload = async (r: DesktopRelease) => {
        setBusyId(r.id);
        try {
            await downloadRelease(r);
        } catch (e: any) {
            showToast(e?.message || 'Download failed', 'error');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-on-surface">Desktop App</h1>
                <p className="text-sm text-on-surface-variant mt-1">
                    Upload the installer your customers download from the Desktop App page.
                </p>
            </header>

            {/* Upload */}
            <form onSubmit={handleUpload} className="dashboard-card p-4 md:p-5 space-y-4">
                <h2 className="font-semibold text-on-surface">Upload a new build</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                        <label htmlFor="rel-file" className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1">
                            Installer file
                        </label>
                        <input
                            id="rel-file"
                            ref={fileInputRef}
                            type="file"
                            accept=".zip,.msix,.exe,.dmg,.AppImage,.deb"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                            className={INPUT}
                            disabled={uploadPct !== null}
                        />
                        {file && (
                            <p className="text-xs text-on-surface-variant mt-1">{file.name} · {formatBytes(file.size)}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="rel-version" className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1">
                            Version
                        </label>
                        <input
                            id="rel-version"
                            type="text"
                            value={version}
                            onChange={e => setVersion(e.target.value)}
                            placeholder="1.4.0"
                            className={INPUT}
                            disabled={uploadPct !== null}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="rel-platform" className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1">
                                Platform
                            </label>
                            <select id="rel-platform" value={platform} onChange={e => setPlatform(e.target.value as ReleasePlatform)} className={INPUT} disabled={uploadPct !== null}>
                                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="rel-channel" className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1">
                                Channel
                            </label>
                            <select id="rel-channel" value={channel} onChange={e => setChannel(e.target.value as ReleaseChannel)} className={INPUT} disabled={uploadPct !== null}>
                                {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="rel-notes" className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1">
                        What&rsquo;s new <span className="font-normal normal-case">(shown to users)</span>
                    </label>
                    <textarea
                        id="rel-notes"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={3}
                        placeholder={'Faster receipt printing\nFixes the till not reopening after a power cut'}
                        className={INPUT}
                        disabled={uploadPct !== null}
                    />
                </div>

                {uploadPct !== null && (
                    <div>
                        <div className="h-2 w-full rounded-full bg-surface-variant overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${uploadPct}%` }} />
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">Uploading… {uploadPct}%</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={uploadPct !== null || !file}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold disabled:opacity-50"
                >
                    {uploadPct !== null ? 'Uploading…' : 'Upload build'}
                </button>
            </form>

            {/* Existing releases */}
            <section className="dashboard-card p-4 md:p-5">
                <h2 className="font-semibold text-on-surface mb-3">Releases</h2>

                {loading ? (
                    <p className="text-sm text-on-surface-variant py-6 text-center">Loading…</p>
                ) : releases.length === 0 ? (
                    <p className="text-sm text-on-surface-variant py-6 text-center">
                        No builds uploaded yet. Upload one above and publish it to make it downloadable.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-on-surface-variant border-b border-brand-border">
                                    <th className="py-2 pr-3">Version</th>
                                    <th className="py-2 pr-3">Platform</th>
                                    <th className="py-2 pr-3">Size</th>
                                    <th className="py-2 pr-3">Downloads</th>
                                    <th className="py-2 pr-3">Status</th>
                                    <th className="py-2 pr-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {releases.map(r => (
                                    <tr key={r.id} className="border-b border-brand-border/60 align-top">
                                        <td className="py-3 pr-3">
                                            <div className="font-semibold text-on-surface">{r.version}</div>
                                            <div className="text-xs text-on-surface-variant">{r.fileName}</div>
                                            {r.checksumSha256 && (
                                                <div className="text-[11px] font-mono text-on-surface-variant mt-1 break-all">
                                                    sha256 {r.checksumSha256.slice(0, 16)}…
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 pr-3 capitalize">
                                            {r.platform}
                                            <div className="text-xs text-on-surface-variant capitalize">{r.channel}</div>
                                        </td>
                                        <td className="py-3 pr-3 whitespace-nowrap">{formatBytes(r.fileSize)}</td>
                                        <td className="py-3 pr-3">{r.downloadCount}</td>
                                        <td className="py-3 pr-3">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${r.isPublished ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
                                                {r.isPublished ? 'Live' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-0">
                                            <div className="flex flex-wrap gap-2 justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => togglePublish(r)}
                                                    disabled={busyId === r.id}
                                                    className="px-3 py-1.5 rounded-lg border border-brand-border font-medium disabled:opacity-50"
                                                >
                                                    {r.isPublished ? 'Unpublish' : 'Publish'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleTestDownload(r)}
                                                    disabled={busyId === r.id}
                                                    className="px-3 py-1.5 rounded-lg border border-brand-border font-medium disabled:opacity-50"
                                                >
                                                    Test
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(r)}
                                                    disabled={busyId === r.id}
                                                    className="px-3 py-1.5 rounded-lg border border-error text-error font-medium disabled:opacity-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {confirmDialog}
        </div>
    );
};

export default SuperAdminDownloads;
