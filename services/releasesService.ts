import { api, API_BASE_URL, getAuthHeaders } from './api';

/**
 * Desktop app downloads.
 *
 * Installers are tens to hundreds of megabytes, so the two heavy operations do
 * NOT go through `api.request()`:
 *
 *  - Upload uses XHR, the only way to get upload progress events in a browser
 *    (fetch still cannot report request-body progress).
 *  - Download streams the response and reports progress, then saves via an
 *    object URL. The bearer token stays in the Authorization HEADER — it is
 *    deliberately never put in the URL, where it would leak into proxy and
 *    server access logs.
 */

export type ReleasePlatform = 'windows' | 'mac' | 'linux';
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

const saveBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke on the next tick: revoking synchronously can cancel the save in
    // some browsers before the download has actually started.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

/**
 * Download an installer with progress. `onProgress` receives 0-100, or -1 when
 * the server did not send a Content-Length and progress is unknowable.
 */
export const downloadRelease = async (
    release: Pick<DesktopRelease, 'id' | 'fileName' | 'fileSize'>,
    onProgress?: (pct: number) => void
): Promise<void> => {
    const resp = await fetch(`${API_BASE_URL}/releases/${release.id}/download`, {
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

    const total = Number(resp.headers.get('Content-Length')) || release.fileSize || 0;

    // No streaming support (or no length): fall back to a plain blob read.
    if (!resp.body || !total) {
        onProgress?.(-1);
        saveBlob(await resp.blob(), release.fileName);
        onProgress?.(100);
        return;
    }

    const reader = resp.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
            chunks.push(value);
            received += value.length;
            onProgress?.(Math.min(99, Math.round((received / total) * 100)));
        }
    }

    saveBlob(new Blob(chunks as BlobPart[]), release.fileName);
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
