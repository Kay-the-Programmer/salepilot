import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The Bluetooth path is the one that carries a receipt to a pocket printer, and
 * every way it goes wrong is silent: an oversized write is refused, an unpaced
 * one overruns the printer's buffer and drops bytes mid-receipt, a link that
 * slept between sales fails only on the first attempt. None of that shows up as
 * a thrown error at the till — it shows up as a customer holding half a receipt.
 * So the byte stream itself is pinned here, against a printer that behaves the
 * way the cheap ones actually do.
 */

type FakeChar = {
    uuid: string;
    properties: { write?: boolean; writeWithoutResponse?: boolean };
    written: number[][];
    maxWrite: number;
    failures: number;
    writeValueWithResponse: (v: Uint8Array) => Promise<void>;
    writeValueWithoutResponse: (v: Uint8Array) => Promise<void>;
    writeValue: (v: Uint8Array) => Promise<void>;
};

const makeChar = (
    uuid: string,
    properties: FakeChar['properties'],
    options: { maxWrite?: number; failures?: number } = {},
): FakeChar => {
    const c = {
        uuid,
        properties,
        written: [] as number[][],
        maxWrite: options.maxWrite ?? 512,
        failures: options.failures ?? 0,
    } as FakeChar;
    const write = async (value: Uint8Array) => {
        if (c.failures > 0) {
            c.failures--;
            throw new Error('GATT operation failed');
        }
        // A real link refuses anything past the negotiated MTU outright.
        if (value.byteLength > c.maxWrite) throw new Error('value too long for characteristic');
        c.written.push(Array.from(value));
    };
    c.writeValueWithResponse = write;
    c.writeValueWithoutResponse = write;
    c.writeValue = write;
    return c;
};

const makeService = (uuid: string, characteristics: FakeChar[]) => ({
    uuid,
    getCharacteristics: async () => characteristics,
    getCharacteristic: async (u: string) => {
        const found = characteristics.find(c => c.uuid === u);
        if (!found) throw new Error('no such characteristic');
        return found;
    },
});

type FakeDevice = ReturnType<typeof makeDevice>;

const makeDevice = (services: ReturnType<typeof makeService>[], name = 'MTP-II') => {
    const listeners: Record<string, (() => void)[]> = {};
    const gatt = {
        connected: false,
        connect: async () => {
            gatt.connected = true;
            return gatt;
        },
        disconnect: () => {
            gatt.connected = false;
            (listeners.gattserverdisconnected ?? []).forEach(fn => fn());
        },
        getPrimaryService: async (uuid: string) => {
            const found = services.find(s => s.uuid === uuid);
            if (!found) throw new Error('no such service');
            return found;
        },
        getPrimaryServices: async () => services,
    };
    return {
        id: 'device-1',
        name,
        gatt,
        addEventListener: (type: string, fn: () => void) => {
            (listeners[type] ??= []).push(fn);
        },
        removeEventListener: (type: string, fn: () => void) => {
            listeners[type] = (listeners[type] ?? []).filter(f => f !== fn);
        },
    };
};

/** The service UUID most 58mm pocket printers put their print pipe behind. */
const POCKET_PRINTER_SERVICE = '0000ff00-0000-1000-8000-00805f9b34fb';
const BATTERY_SERVICE = '0000180f-0000-1000-8000-00805f9b34fb';

const memoryStorage = () => {
    const store = new Map<string, string>();
    return {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
        clear: () => store.clear(),
    };
};

/**
 * A fresh copy of the service per test.
 *
 * It keeps the live link in module state — deliberately, so a till holds one
 * connection rather than reopening it per sale — which means tests have to
 * start from a clean module or they inherit each other's printer.
 */
const loadService = async (device: FakeDevice | null) => {
    vi.resetModules();
    vi.stubGlobal('localStorage', memoryStorage());
    vi.stubGlobal('navigator', {
        bluetooth: device
            ? {
                  getAvailability: async () => true,
                  requestDevice: async () => device,
                  getDevices: async () => [device],
              }
            : undefined,
    });
    return import('./thermalPrinter');
};

/** Everything the printer received, in order, as one stream. */
const streamOf = (char: FakeChar): number[] => char.written.flat();

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('chunkBytes', () => {
    it('covers the input exactly, in order', async () => {
        const { chunkBytes } = await loadService(null);
        const bytes = Uint8Array.from({ length: 250 }, (_, i) => i % 256);
        const chunks = chunkBytes(bytes, 100);
        expect(chunks.map(c => c.length)).toEqual([100, 100, 50]);
        expect(chunks.flatMap(c => Array.from(c))).toEqual(Array.from(bytes));
    });

    it('emits one chunk when the receipt already fits', async () => {
        const { chunkBytes } = await loadService(null);
        expect(chunkBytes(new Uint8Array(10), 512)).toHaveLength(1);
    });

    it('never emits an empty chunk, whatever size it is handed', async () => {
        const { chunkBytes } = await loadService(null);
        // A zero or fractional size would otherwise loop forever or write nothing.
        for (const size of [0, -5, 1.5]) {
            const chunks = chunkBytes(new Uint8Array(4), size);
            expect(chunks.every(c => c.length > 0)).toBe(true);
            expect(chunks.flatMap(c => Array.from(c))).toHaveLength(4);
        }
    });
});

describe('resetProbe', () => {
    it('is nothing but printer resets, so calibration prints nothing', async () => {
        const { resetProbe } = await loadService(null);
        expect(Array.from(resetProbe(6))).toEqual([0x1b, 0x40, 0x1b, 0x40, 0x1b, 0x40]);
    });

    it('never ends on a bare ESC, which would eat the next byte sent', async () => {
        const { resetProbe } = await loadService(null);
        const probe = resetProbe(5);
        expect(probe).toHaveLength(5);
        expect(probe[4]).toBe(0x0a);
    });
});

describe('connecting a Bluetooth printer', () => {
    it('writes to the characteristic behind a known printer service', async () => {
        const char = makeChar('0000ff02-0000-1000-8000-00805f9b34fb', { write: true });
        const device = makeDevice([makeService(POCKET_PRINTER_SERVICE, [char])]);
        const { requestBluetoothPrinter, printBytes } = await loadService(device);

        const connected = await requestBluetoothPrinter();
        expect(connected).toEqual({ transport: 'bluetooth', label: 'MTP-II' });

        char.written.length = 0;
        await printBytes(Uint8Array.from([1, 2, 3]));
        expect(streamOf(char)).toEqual([1, 2, 3]);
    });

    it('finds the pipe behind a vendor service no list could predict', async () => {
        // Clone firmware routinely invents its own UUID. Sweeping for anything
        // writable is what keeps those printers usable at all.
        const char = makeChar('0000abcd-0000-1000-8000-00805f9b34fb', { writeWithoutResponse: true });
        const device = makeDevice([makeService('0000dead-0000-1000-8000-00805f9b34fb', [char])]);
        const { requestBluetoothPrinter, printBytes } = await loadService(device);

        await requestBluetoothPrinter();
        char.written.length = 0;
        await printBytes(Uint8Array.from([9, 9]));
        expect(streamOf(char)).toEqual([9, 9]);
    });

    it('says so plainly when the chosen device is not a printer', async () => {
        // Picking a phone or a speaker out of the list is the commonest setup
        // mistake, and it must not look like a broken printer.
        const device = makeDevice([makeService(BATTERY_SERVICE, [])]);
        const { requestBluetoothPrinter, PrinterError } = await loadService(device);
        await expect(requestBluetoothPrinter()).rejects.toBeInstanceOf(PrinterError);
    });

    it('reports the adapter being off rather than blaming the printer', async () => {
        vi.resetModules();
        vi.stubGlobal('localStorage', memoryStorage());
        vi.stubGlobal('navigator', {
            bluetooth: {
                getAvailability: async () => false,
                requestDevice: async () => { throw new Error('no scan'); },
                getDevices: async () => [],
            },
        });
        const { requestBluetoothPrinter } = await import('./thermalPrinter');
        await expect(requestBluetoothPrinter()).rejects.toThrow(/Bluetooth is switched off/);
    });
});

describe('sizing writes to the link', () => {
    it('steps down until the writes fit, and sends the whole receipt', async () => {
        // 100 bytes is a realistic MTU for a cheap printer on a phone. Sending
        // 512 at it is refused outright, and guessing wrong is how a receipt
        // ends up half-printed.
        const char = makeChar('0000ff02-0000-1000-8000-00805f9b34fb', { write: true }, { maxWrite: 100 });
        const device = makeDevice([makeService(POCKET_PRINTER_SERVICE, [char])]);
        const { requestBluetoothPrinter, printBytes } = await loadService(device);

        await requestBluetoothPrinter();
        char.written.length = 0;

        const receipt = Uint8Array.from({ length: 350 }, (_, i) => i % 251);
        await printBytes(receipt);

        expect(Math.max(...char.written.map(c => c.length))).toBeLessThanOrEqual(100);
        expect(streamOf(char)).toEqual(Array.from(receipt));
    });

    it('remembers the size it settled on, so later sales do not re-probe', async () => {
        const char = makeChar('0000ff02-0000-1000-8000-00805f9b34fb', { write: true }, { maxWrite: 128 });
        const device = makeDevice([makeService(POCKET_PRINTER_SERVICE, [char])]);
        const { requestBluetoothPrinter, printBytes } = await loadService(device);

        await requestBluetoothPrinter();
        char.written.length = 0;

        await printBytes(Uint8Array.from([1]));
        await printBytes(Uint8Array.from([2]));
        // Two receipts, two writes. A probe on the second would show up here.
        expect(char.written).toEqual([[1], [2]]);
    });

    it('does not attempt long writes on a link that cannot acknowledge them', async () => {
        const char = makeChar('0000ff02-0000-1000-8000-00805f9b34fb', { writeWithoutResponse: true });
        const device = makeDevice([makeService(POCKET_PRINTER_SERVICE, [char])]);
        const { requestBluetoothPrinter, printBytes } = await loadService(device);

        await requestBluetoothPrinter();
        char.written.length = 0;

        const receipt = Uint8Array.from({ length: 300 }, () => 0x41);
        await printBytes(receipt);

        // An unacknowledged write cannot exceed the MTU, so 512 is never on the
        // table however permissive the fake printer is.
        expect(Math.max(...char.written.map(c => c.length))).toBeLessThanOrEqual(244);
        expect(streamOf(char)).toEqual(Array.from(receipt));
    });
});

describe('surviving the things that actually happen at a till', () => {
    it('reconnects a printer that slept between sales', async () => {
        const char = makeChar('0000ff02-0000-1000-8000-00805f9b34fb', { write: true });
        const device = makeDevice([makeService(POCKET_PRINTER_SERVICE, [char])]);
        const { requestBluetoothPrinter, printBytes } = await loadService(device);

        await requestBluetoothPrinter();
        char.written.length = 0;

        device.gatt.disconnect();
        expect(device.gatt.connected).toBe(false);

        await printBytes(Uint8Array.from([7, 7, 7]));
        expect(device.gatt.connected).toBe(true);
        expect(streamOf(char)).toEqual([7, 7, 7]);
    });

    it('retries once through a fresh link when the first write fails', async () => {
        const char = makeChar('0000ff02-0000-1000-8000-00805f9b34fb', { write: true });
        const device = makeDevice([makeService(POCKET_PRINTER_SERVICE, [char])]);
        const { requestBluetoothPrinter, printBytes } = await loadService(device);

        await requestBluetoothPrinter();
        char.written.length = 0;
        // A stale handle refuses exactly once and then behaves. Without the
        // retry this is a cashier reconnecting the printer several times a day.
        char.failures = 1;

        await printBytes(Uint8Array.from([5, 6]));
        expect(streamOf(char)).toEqual([5, 6]);
    });

    it('gives up with a usable message when the printer is really gone', async () => {
        const char = makeChar('0000ff02-0000-1000-8000-00805f9b34fb', { write: true });
        const device = makeDevice([makeService(POCKET_PRINTER_SERVICE, [char])]);
        const { requestBluetoothPrinter, printBytes } = await loadService(device);

        await requestBluetoothPrinter();
        char.failures = Number.MAX_SAFE_INTEGER;

        await expect(printBytes(Uint8Array.from([1]))).rejects.toThrow(/MTP-II/);
    });

    it('keeps two receipts from interleaving on the wire', async () => {
        // ESC/POS has no framing. Two overlapping jobs print as nonsense, and a
        // double-tapped Print button is all it takes.
        // A tight MTU forces each receipt into several writes, which is what
        // gives two concurrent jobs the chance to interleave.
        const char = makeChar('0000ff02-0000-1000-8000-00805f9b34fb', { write: true }, { maxWrite: 20 });
        const device = makeDevice([makeService(POCKET_PRINTER_SERVICE, [char])]);
        const { requestBluetoothPrinter, printBytes } = await loadService(device);

        await requestBluetoothPrinter();
        char.written.length = 0;

        const first = new Uint8Array(60).fill(1);
        const second = new Uint8Array(60).fill(2);
        await Promise.all([printBytes(first), printBytes(second)]);

        expect(char.written.length).toBeGreaterThan(2);
        expect(streamOf(char)).toEqual([...first, ...second]);
    });

    it('refuses to print, rather than hang, with no printer set up', async () => {
        const { printBytes, PrinterError } = await loadService(null);
        await expect(printBytes(Uint8Array.from([1]))).rejects.toBeInstanceOf(PrinterError);
    });
});

describe('battery on a pocket printer', () => {
    /** The standard battery service, as a printer that implements it exposes it. */
    const batteryService = (percent: number) => ({
        uuid: BATTERY_SERVICE,
        getCharacteristics: async () => [],
        getCharacteristic: async () => ({
            readValue: async () => new DataView(Uint8Array.of(percent).buffer),
        }),
    });

    it('is read during setup, where a low charge can still be acted on', async () => {
        const char = makeChar('0000ff02-0000-1000-8000-00805f9b34fb', { write: true });
        const device = makeDevice([
            makeService(POCKET_PRINTER_SERVICE, [char]),
            batteryService(14) as unknown as ReturnType<typeof makeService>,
        ]);
        const { requestBluetoothPrinter, getPrinterStatus } = await loadService(device);

        await requestBluetoothPrinter();
        // Awaited, not fired and forgotten: settings refreshes the moment the
        // connect resolves, and a reading that lands after that is never shown.
        expect((await getPrinterStatus()).batteryPercent).toBe(14);
    });

    it('reports nothing at all for a printer that does not implement it', async () => {
        const char = makeChar('0000ff02-0000-1000-8000-00805f9b34fb', { write: true });
        const device = makeDevice([makeService(POCKET_PRINTER_SERVICE, [char])]);
        const { requestBluetoothPrinter, getPrinterStatus } = await loadService(device);

        await requestBluetoothPrinter();
        expect((await getPrinterStatus()).batteryPercent).toBeNull();
    });
});
