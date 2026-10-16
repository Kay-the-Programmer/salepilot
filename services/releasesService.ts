import { api, API_BASE_URL, getAuthHeaders } from './api';

/**
 * App downloads — desktop installers and the Android APK.
 *
 * The `/releases/desktop` endpoints are named for the builds that came first;
 * they take a `platform` and serve Android too.
 *
 * Installers are tens to hundreds of megabytes, so the two heavy operations do
 * NOT go through `api.request()`:
 *
 *  - Upload uses XHR, the only way to get upload progress events in a browser
 *    (fetch still cannot report request-body progress).
 *  - Download does not pass through the page at all. It mints a single-use
 *    ticket over an authenticated request and then hands the plain ticket URL
 *    to the browser, which streams the file straight to disk with its own
 *    progress UI and resume support. The previous version read the response
 *    into a Blob, which meant a whole 300MB installer — or an APK on a phone,
 *    where the ceiling is far lower — sat in memory before a byte reached disk,
 *    and a failed allocation looked like a download that just didn't happen.
 *
 * The bearer token is still never put in a URL, where it would leak into proxy
 * and server access logs. The ticket is a different thing: opaque, valid for
 * two minutes, bound to one release and one user, and burned on first use.
 */

export type ReleasePlatform = 'windows' | 'mac' | 'linux' | 'android';
export type ReleaseChannel = 'stable' | 'beta';

export interface DesktopRelease {
    id: string;
    version: string;
    platform: ReleasePlatform;
    channel: ReleaseChannel;
    notes: string | null;
    fileName: string;
    fileSize: number;
    checksumSha256: string | null;
    isPublished: boolean;
    downloadCount: number;
    createdAt: string;
    updatedAt: string;
}

/** Human-readable size. Installers are MB-to-GB, so start at MB. */
export const formatBytes = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '—';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/* ----------------------------- read ----------------------------- */

export const listPublishedReleases = (platform?: ReleasePlatform) =>
    api.get<DesktopRelease[]>(`/releases/desktop${platform ? `?platform=${platform}` : ''}`);

/** Resolves to null when nothing has been published yet (the API 404s). */
export const getLatestRelease = async (
    platform: ReleasePlatform = 'windows',
    channel: ReleaseChannel = 'stable'
): Promise<DesktopRelease | null> => {
    try {
        return await api.get<DesktopRelease>(`/releases/desktop/latest?platform=${platform}&channel=${channel}`);
    } catch (e: any) {
        if (e?.status === 404) return null;
        throw e;
    }
};

/* --------------------------- download --------------------------- */

interface DownloadTicket {
    downloadPath: string;
    fileName: string;
    fileSize: number;
    expiresAt: string;
}

/**
 * Download an installer.
 *
 * Two steps: mint a single-use ticket with the session token in the
 * Authorization header, then let the browser fetch the ticket URL natively.
 * Nothing is buffered in the page, so the size of the file no longer matters —
 * which is what makes the Android APK safe to serve from here.
 *
 * `onProgress` is kept for the callers' sake but now only reports -1
 * (indeterminate) then 100: once the browser owns the transfer, the page
 * cannot see its progress. The browser shows its own.
 */
export const downloadRelease = async (
    release: Pick<DesktopRelease, 'id' | 'fileName' | 'fileSize'>,
    onProgress?: (pct: number) => void
): Promise<void> => {
    onProgress?.(-1);

    // Deliberately a bare fetch rather than api.post(): minting must never be
    // queued by the offline mutation queue — a ticket that is redeemed minutes
    // later is already expired, and there is nothing to download offline.
    const resp = await fetch(`${API_BASE_URL}/releases/${release.id}/download-token`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });

    if (!resp.ok) {
        let message = `Download failed (${resp.status})`;
        try {
            const body = await resp.json();
            if (body?.message) message = body.message;
        } catch { /* non-JSON error body */ }
        throw new Error(message);
    }

    const ticket: DownloadTicket = await resp.json();
    if (!ticket?.downloadPath) throw new Error('The server did not return a download link.');

    const a = document.createElement('a');
    a.href = `${API_BASE_URL}${ticket.downloadPath}`;
    // Honoured same-origin; cross-origin the browser uses the server's
    // Content-Disposition filename instead, which names the same file.
    a.download = ticket.fileName || release.fileName;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();

    onProgress?.(100);
};


/* ------------------------ super admin ------------------------ */

export const listAllReleases = () => api.get<DesktopRelease[]>('/superadmin/releases');

export interface UploadFields {
    version: string;
    platform: ReleasePlatform;
    channel: ReleaseChannel;
    notes?: string;
}

/**
 * Upload an installer. Uses XHR purely for `upload.onprogress` — a multi-minute
 * upload with no progress bar looks like a frozen page.
 */
export const uploadRelease = (
    file: File,
    fields: UploadFields,
    onProgress?: (pct: number) => void
): Promise<DesktopRelease> =>
    new Promise((resolve, reject) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('version', fields.version);
        fd.append('platform', fields.platform);
        fd.append('channel', fields.channel);
        if (fields.notes) fd.append('notes', fields.notes);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/superadmin/releases`);
        // Content-Type is left unset on purpose: the browser must add the
        // multipart boundary itself.
        Object.entries(getAuthHeaders()).forEach(([k, v]) => xhr.setRequestHeader(k, v));

        xhr.upload.onprogress = e => {
            if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
            let body: any;
            try { body = JSON.parse(xhr.responseText); } catch { body = undefined; }
            if (xhr.status >= 200 && xhr.status < 300) return resolve(body as DesktopRelease);
            reject(new Error(body?.message || `Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));
        xhr.onabort = () => reject(new Error('Upload cancelled.'));

        xhr.send(fd);
    });

export const updateRelease = (id: string, body: { isPublished?: boolean; notes?: string }) =>
    api.patch<DesktopRelease>(`/superadmin/releases/${id}`, body);

export const deleteRelease = (id: string) =>
    api.delete<{ success: boolean }>(`/superadmin/releases/${id}`);
