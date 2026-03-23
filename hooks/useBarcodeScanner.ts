import { useEffect, useRef, useState, useCallback } from 'react';

export interface BarcodeScannerConfig {
    enabled: boolean;
    minLength: number;
    maxInterCharDelayMs: number;
    prefix: string;
    suffix: string;
}

const CONFIG_KEY = 'sp_barcode_scanner_config';

export const DEFAULT_SCANNER_CONFIG: BarcodeScannerConfig = {
    enabled: true,
    minLength: 4,
    maxInterCharDelayMs: 50,
    prefix: '',
    suffix: '',
};

export function loadScannerConfig(): BarcodeScannerConfig {
    try {
        const raw = localStorage.getItem(CONFIG_KEY);
        if (raw) {
            return { ...DEFAULT_SCANNER_CONFIG, ...JSON.parse(raw) };
        }
    } catch {
        // ignore
    }
    return { ...DEFAULT_SCANNER_CONFIG };
}

export function saveScannerConfig(config: BarcodeScannerConfig): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

interface UseBarcannnerOptions {
    /** If true the hook will not listen for keyboard events (e.g. while a text modal is open). Default: false */
    paused?: boolean;
}

/**
 * Detects input from a USB/HID barcode scanner.
 *
 * Barcode scanners emulate a keyboard: they send keystrokes very quickly
 * (< 50 ms apart) and terminate with an Enter key.
 *
 * The hook collects characters that arrive within the threshold, and when
 * Enter is received it fires `onScan` with the assembled barcode string.
 *
 * @param onScan - Callback fired with the decoded barcode string.
 * @param options - Optional configuration overrides.
 * @returns `isActive` - true when an external scanner has been detected in the last 5 sec.
 */
export function useBarcodeScanner(
    onScan: (barcode: string) => void,
    options: UseBarcannnerOptions = {}
): { isActive: boolean } {
    const { paused = false } = options;

    const [isActive, setIsActive] = useState(false);

    // We store these in refs so the keydown handler is stable (no recreations)
    const bufferRef = useRef<string>('');
    const lastKeyTimeRef = useRef<number>(0);
    const onScanRef = useRef(onScan);
    const pausedRef = useRef(paused);
    const configRef = useRef<BarcodeScannerConfig>(loadScannerConfig());
    const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep refs fresh
    useEffect(() => { onScanRef.current = onScan; }, [onScan]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);

    // Reload config whenever localStorage changes (e.g. after wizard save)
    const reloadConfig = useCallback(() => {
        configRef.current = loadScannerConfig();
    }, []);

    useEffect(() => {
        window.addEventListener('sp_scanner_config_saved', reloadConfig);
        return () => window.removeEventListener('sp_scanner_config_saved', reloadConfig);
    }, [reloadConfig]);

    const markActive = useCallback(() => {
        setIsActive(true);
        if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
        activityTimerRef.current = setTimeout(() => setIsActive(false), 5000);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (pausedRef.current) return;

            const cfg = configRef.current;
            if (!cfg.enabled) return;

            const now = Date.now();
            const elapsed = now - lastKeyTimeRef.current;

            // If too slow to be a scanner, reset buffer (could be regular typing)
            if (elapsed > cfg.maxInterCharDelayMs && bufferRef.current.length > 0) {
                bufferRef.current = '';
            }

            lastKeyTimeRef.current = now;

            if (e.key === 'Enter') {
                let barcode = bufferRef.current;
                bufferRef.current = '';

                // Strip prefix/suffix if configured
                if (cfg.prefix && barcode.startsWith(cfg.prefix)) {
                    barcode = barcode.slice(cfg.prefix.length);
                }
                if (cfg.suffix && barcode.endsWith(cfg.suffix)) {
                    barcode = barcode.slice(0, -cfg.suffix.length);
                }

                if (barcode.length >= cfg.minLength) {
                    markActive();
                    onScanRef.current(barcode);
                }
                return;
            }

            // Only collect single printable characters
            if (e.key.length === 1) {
                bufferRef.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
    }, [markActive]);

    return { isActive };
}
