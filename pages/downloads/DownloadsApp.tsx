import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StandaloneTopBar from '../../components/standalone/StandaloneTopBar';
import { useToast } from '../../contexts/ToastContext';
import { getCurrentUser } from '../../services/authService';
import {
    DesktopRelease, ReleasePlatform,
    listPublishedReleases, downloadRelease, formatBytes,
} from '../../services/releasesService';
import '../assistant/assistant.css';
import './downloads.css';

/**
 * Downloads — where a customer gets the till: the desktop installers and the
 * Android APK. Tabs are built from whatever platforms actually have a
 * published build, so Android appears here as soon as one is published.
 *
 * The installer is uploaded and published by the Super Admin; this page only
 * lists what is live. The download is fetched with the session's bearer token
 * rather than linked directly, so the binary is not hotlinkable.
 */

/**
 * Best-effort OS guess, only to pre-select a tab. Users can still switch.
 *
 * Android is tested before mac and linux on purpose: an Android UA contains
 * "linux", and an iPad's contains "mac", so order is what keeps a phone off
 * the desktop tab.
 */
const guessPlatform = (): ReleasePlatform => {
    if (typeof navigator === 'undefined') return 'windows';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) return 'android';
    if (ua.includes('mac')) return 'mac';
    if (ua.includes('linux')) return 'linux';
    return 'windows';
};

const PLATFORM_LABEL: Record<ReleasePlatform, string> = {
    windows: 'Windows',
    mac: 'macOS',
    linux: 'Linux',
    android: 'Android',
};

const formatDate = (iso: string) => {
    try {
        return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return '';
    }
};

const DownloadsApp: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const user = getCurrentUser();

    const [releases, setReleases] = useState<DesktopRelease[]>([]);
    const [loading, setLoading] = useState(true);
    const [platform, setPlatform] = useState<ReleasePlatform>(guessPlatform());
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const list = await listPublishedReleases();
                if (!cancelled) setReleases(list);
            } catch (e: any) {
                if (!cancelled) showToast(e?.message || 'Could not load downloads', 'error');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDownload = useCallback(async (release: DesktopRelease) => {
        setDownloadingId(release.id);
        setProgress(0);
        try {
            await downloadRelease(release, pct => setProgress(pct < 0 ? 0 : pct));
            showToast('Download started. Check your downloads folder.', 'success');
        } catch (e: any) {
            showToast(e?.message || 'Download failed', 'error');
        } finally {
            setDownloadingId(null);
            setProgress(0);
        }
    }, [showToast]);

    const forPlatform = releases.filter(r => r.platform === platform);
    const current = forPlatform[0] || null;
    const older = forPlatform.slice(1);
    const availablePlatforms = (Object.keys(PLATFORM_LABEL) as ReleasePlatform[])
        .filter(p => releases.some(r => r.platform === p));

    return (
        <div className="sp-assistant downloads-app flex flex-col h-screen bg-brand-bg">
            <StandaloneTopBar
                className="relative flex-shrink-0 h-16 bg-surface border-b border-brand-border shadow-sm flex items-center justify-between px-4 md:px-8 z-20"
                currentRoute="downloads"
                navItems={[{ icon: 'download', label: 'Desktop App', active: true, onClick: () => {} }]}
                onExit={() => navigate('/')}
            />

            <main className="flex-1 overflow-y-auto">
                <div className="downloads-wrap">
                    <header className="downloads-hero">
                        <span className="downloads-hero__eyebrow">SalePilot for desktop</span>
                        <h1 className="downloads-hero__title">Run your till on a computer</h1>
                        <p className="downloads-hero__sub">
                            The desktop app keeps selling when the internet is down and syncs back to your
                            account as soon as it returns. Your products, staff and prices are the same ones
                            you use here.
                        </p>
                    </header>

                    {availablePlatforms.length > 1 && (
                        <div className="downloads-tabs" role="tablist" aria-label="Choose your operating system">
                            {availablePlatforms.map(p => (
                                <button
                                    key={p}
                                    role="tab"
                                    aria-selected={platform === p}
                                    className={`downloads-tab${platform === p ? ' is-active' : ''}`}
                                    onClick={() => setPlatform(p)}
                                >
                                    {PLATFORM_LABEL[p]}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="downloads-empty">Loading…</div>
                    ) : !current ? (
                        <div className="downloads-empty">
                            <h2>No download yet</h2>
                            <p>
                                There is no published {PLATFORM_LABEL[platform]} build right now.
                                {user?.role === 'superadmin'
                                    ? ' Upload one from Super Admin → Downloads.'
                                    : ' Check back shortly, or ask support when it will be ready.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <section className="downloads-card">
                                <div className="downloads-card__head">
                                    <div>
                                        <h2 className="downloads-card__title">
                                            {PLATFORM_LABEL[current.platform]} · version {current.version}
                                        </h2>
                                        <p className="downloads-card__meta">
                                            {formatBytes(current.fileSize)} · Released {formatDate(current.createdAt)}
                                            {current.channel === 'beta' && <span className="downloads-chip">Beta</span>}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="downloads-btn"
                                        onClick={() => handleDownload(current)}
                                        disabled={downloadingId === current.id}
                                    >
                                        {downloadingId === current.id
                                            ? (progress > 0 ? `Downloading ${progress}%` : 'Starting…')
                                            : 'Download'}
                                    </button>
                                </div>

                                {downloadingId === current.id && (
                                    <div className="downloads-progress" aria-hidden="true">
                                        <div className="downloads-progress__bar" style={{ width: `${progress}%` }} />
                                    </div>
                                )}

                                {current.notes && (
                                    <div className="downloads-notes">
                                        <h3>What&rsquo;s new</h3>
                                        <p>{current.notes}</p>
                                    </div>
                                )}

                                {/* An APK is sideloaded, so Android blocks the install until the
                                    user allows this source. Showing the desktop steps there would
                                    leave them stuck on a permission prompt nothing explains. */}
                                {current.platform === 'android' ? (
                                    <ol className="downloads-steps">
                                        <li>Tap <strong>Download</strong>, then open the file when it finishes.</li>
                                        <li>
                                            Android will ask whether to allow installing apps from your browser.
                                            Tap <strong>Settings → Allow from this source</strong>, then go back
                                            and tap <strong>Install</strong>.
                                        </li>
                                        <li>Sign in with the same email and password you use here.</li>
                                    </ol>
                                ) : (
                                    <ol className="downloads-steps">
                                        <li>Download the file, then open it from your downloads folder.</li>
                                        <li>If Windows warns about an unknown publisher, choose <strong>More info → Run anyway</strong>.</li>
                                        <li>Sign in with the same email and password you use here.</li>
                                    </ol>
                                )}

                                {current.checksumSha256 && (
                                    <p className="downloads-checksum">
                                        SHA-256 <code>{current.checksumSha256}</code>
                                    </p>
                                )}
                            </section>

                            {older.length > 0 && (
                                <section className="downloads-older">
                                    <h3>Earlier versions</h3>
                                    <ul>
                                        {older.map(r => (
                                            <li key={r.id}>
                                                <span>
                                                    <strong>{r.version}</strong>
                                                    <span className="downloads-older__meta">
                                                        {formatBytes(r.fileSize)} · {formatDate(r.createdAt)}
                                                    </span>
                                                </span>
                                                <button
                                                    type="button"
                                                    className="downloads-btn downloads-btn--ghost"
                                                    onClick={() => handleDownload(r)}
                                                    disabled={downloadingId === r.id}
                                                >
                                                    {downloadingId === r.id
                                                        ? (progress > 0 ? `${progress}%` : '…')
                                                        : 'Download'}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DownloadsApp;
