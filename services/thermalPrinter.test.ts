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

/**
 * Why a till cannot print matters as much as that it cannot.
 *
 * All three cases look identical from the code's point of view — no printer
 * APIs on the object — but only one of them has a fix the shop can carry out,
 * and one of them has no fix on that device at all. Telling an iPhone owner to
 * try a different browser sends them round a loop that cannot end, because
 * every browser on iOS is Safari underneath.
 */
describe('getUnsupportedReason', () => {
    const load = async (env: {
        ua?: string;
        maxTouchPoints?: number;
        secure?: boolean;
        bluetooth?: boolean;
    }) => {
        vi.resetModules();
        vi.stubGlobal('localStorage', memoryStorage());
        vi.stubGlobal('window', { isSecureContext: env.secure ?? true });
        vi.stubGlobal('navigator', {
            userAgent: env.ua ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            maxTouchPoints: env.maxTouchPoints ?? 0,
            bluetooth: env.bluetooth ? { requestDevice: async () => null } : undefined,
        });
        return import('./thermalPrinter');
    };

    const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
    const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15';

    it('says nothing is wrong when the browser can reach a printer', async () => {
        const { getUnsupportedReason } = await load({ bluetooth: true });
        expect(getUnsupportedReason()).toBeNull();
    });

    it('names iOS, which no browser choice can work around', async () => {
        const { getUnsupportedReason } = await load({ ua: IPHONE });
        expect(getUnsupportedReason()).toBe('ios');
    });

    it('spots an iPad, which claims to be a Mac', async () => {
        // iPadOS 13 and later report a desktop user agent. Only the touch
        // screen separates an iPad from a Mac, and a Mac genuinely can print.
        const { getUnsupportedReason } = await load({ ua: IPAD, maxTouchPoints: 5 });
        expect(getUnsupportedReason()).toBe('ios');
    });

    it('does not mistake a desktop Mac for an iPad', async () => {
        const { getUnsupportedReason } = await load({ ua: IPAD, maxTouchPoints: 0 });
        expect(getUnsupportedReason()).toBe('browser');
    });

    it('calls out plain HTTP, which is the one the shop can fix', async () => {
        // A till opened at http://192.168.1.20 looks exactly as unsupported as
        // an iPhone, and the fix is entirely different.
        const { getUnsupportedReason } = await load({ secure: false });
        expect(getUnsupportedReason()).toBe('insecure-context');
    });

    it('still says iOS for an iPhone on plain HTTP', async () => {
        // Ordering matters: HTTPS would not help here, and sending someone to
        // fix a certificate they do not need is an afternoon wasted.
        const { getUnsupportedReason } = await load({ ua: IPHONE, secure: false });
        expect(getUnsupportedReason()).toBe('ios');
    });
});

/**
 * What the till does with the receipt once a sale is paid.
 *
 * The stake is a sale that cannot be undone: whichever way this reads, the
 * cashier has already taken the money. So an unset preference must land on the
 * behaviour every till had before the setting existed — showing the receipt —
 * and anything unrecognised in storage (an older build, a half-written value,
 * a hand-edited key) has to land there too rather than silently deciding, on a
 * till that does print, that receipts are no longer worth printing.
 */
describe('the receipt preference', () => {
    const load = async (stored?: string) => {
        vi.resetModules();
        const storage = memoryStorage();
        if (stored !== undefined) storage.setItem('salepilot.printer.receiptBehaviour', stored);
        vi.stubGlobal('localStorage', storage);
        vi.stubGlobal('window', { isSecureContext: true });
        vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', maxTouchPoints: 0 });
        return { mod: await import('./thermalPrinter'), storage };
    };

    it('shows the receipt when nothing has been chosen', async () => {
        const { mod } = await load();
        expect(mod.getReceiptBehaviour()).toBe('ask');
    });

    it('keeps the choice a till made', async () => {
        const { mod, storage } = await load();
        mod.setReceiptBehaviour('skip');
        expect(storage.getItem('salepilot.printer.receiptBehaviour')).toBe('skip');
        expect(mod.getReceiptBehaviour()).toBe('skip');
    });

    it('reads back every supported mode', async () => {
        for (const mode of ['ask', 'print', 'skip'] as const) {
            const { mod } = await load(mode);
            expect(mod.getReceiptBehaviour()).toBe(mode);
        }
    });

    it('falls back to showing the receipt when the stored value is not one it knows', async () => {
        for (const junk of ['', 'always', 'PRINT', '{"b":"skip"}']) {
            const { mod } = await load(junk);
            expect(mod.getReceiptBehaviour()).toBe('ask');
        }
    });

    it('does not throw when storage is unavailable', async () => {
        vi.resetModules();
        vi.stubGlobal('localStorage', {
            getItem: () => { throw new Error('storage disabled'); },
            setItem: () => { throw new Error('storage disabled'); },
            removeItem: () => { throw new Error('storage disabled'); },
        });
        vi.stubGlobal('window', { isSecureContext: true });
        vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0', maxTouchPoints: 0 });
        const mod = await import('./thermalPrinter');
        expect(() => mod.setReceiptBehaviour('print')).not.toThrow();
        // Private mode loses the preference, which must degrade to the safe
        // default rather than taking the till down mid-shift.
        expect(mod.getReceiptBehaviour()).toBe('ask');
    });
});

/**
 * The USB path, which is the counter printer plugged into a laptop.
 *
 * Two things go wrong here and neither announces itself. A grant is per origin,
 * not per device, so `getDevices()` hands back everything ever granted and
 * picking among them by guesswork sends receipts to the wrong device — with no
 * error, because the write genuinely succeeds. And on Windows the system owns
 * any device that identifies as a printer, so the browser is refused outright;
 * reported as a stale handle, that becomes a cashier checking a paper roll that
 * was never the problem.
 */
type FakeUsbDevice = ReturnType<typeof makeUsbDevice>;

const makeUsbDevice = (
    options: {
        vendorId: number;
        productId: number;
        productName?: string;
        /** 0x07 marks it a printer; clones commonly declare 0xFF instead. */
        interfaceClass?: number;
        /** Windows holding the device: the browser never gets it open. */
        openFails?: boolean;
    },
) => {
    const config = {
        interfaces: [
            {
                interfaceNumber: 0,
                alternates: [
                    {
                        interfaceClass: options.interfaceClass ?? 0x07,
                        endpoints: [{ direction: 'out', type: 'bulk', endpointNumber: 1 }],
                    },
                ],
            },
        ],
    };
    const device = {
        vendorId: options.vendorId,
        productId: options.productId,
        productName: options.productName,
        deviceClass: 0,
        configurations: [config],
        configuration: null as typeof config | null,
        opened: false,
        forgotten: false,
        written: [] as number[][],
        open: async () => {
            if (options.openFails) {
                const err = new Error('Access denied.');
                err.name = 'SecurityError';
                throw err;
            }
            device.opened = true;
        },
        selectConfiguration: async () => {
            device.configuration = config;
        },
        claimInterface: async () => {},
        transferOut: async (_endpoint: number, bytes: Uint8Array) => {
            device.written.push(Array.from(bytes));
            return { status: 'ok', bytesWritten: bytes.byteLength };
        },
        close: async () => {
            device.opened = false;
        },
        forget: async () => {
            device.forgotten = true;
        },
    };
    return device;
};

const loadUsbService = async (granted: FakeUsbDevice[], picked?: FakeUsbDevice) => {
    vi.resetModules();
    vi.stubGlobal('localStorage', memoryStorage());
    vi.stubGlobal('window', { isSecureContext: true });
    vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        maxTouchPoints: 0,
        usb: {
            getDevices: async () => granted,
            requestDevice: async () => picked ?? granted[0],
        },
    });
    return import('./thermalPrinter');
};

describe('choosing a USB printer', () => {
    it('writes to the device that was picked, not the one that looks likeliest', async () => {
        // A grant the origin already held, which declares the printer class...
        const other = makeUsbDevice({ vendorId: 0x1111, productId: 0x1, productName: 'Old printer' });
        // ...and the printer actually on the counter, a clone declaring 0xFF.
        const chosen = makeUsbDevice({
            vendorId: 0x2222,
            productId: 0x2,
            productName: 'XP-58',
            interfaceClass: 0xff,
        });
        const mod = await loadUsbService([other, chosen], chosen);

        await mod.requestUsbPrinter();
        await mod.printBytes(new Uint8Array([1, 2, 3]));

        expect(chosen.written).toEqual([[1, 2, 3]]);
        // The whole point: the receipt must not go to the other device, which
        // would print nothing and report success.
        expect(other.written).toEqual([]);
    });

    it('names the printer the cashier picked', async () => {
        const chosen = makeUsbDevice({ vendorId: 0x2222, productId: 0x2, productName: 'XP-58' });
        const mod = await loadUsbService([chosen], chosen);

        expect((await mod.requestUsbPrinter()).label).toBe('XP-58');
        expect((await mod.getPrinterStatus()).label).toBe('XP-58');
    });

    it('still finds the printer on a till set up before the choice was recorded', async () => {
        const only = makeUsbDevice({ vendorId: 0x3333, productId: 0x3, productName: 'Counter' });
        const mod = await loadUsbService([only]);

        // No saved id — the grant is all there is to go on, and it must work.
        await mod.printBytes(new Uint8Array([9]));
        expect(only.written).toEqual([[9]]);
    });

    it('hands the grant back when the printer is forgotten', async () => {
        const chosen = makeUsbDevice({ vendorId: 0x2222, productId: 0x2 });
        const mod = await loadUsbService([chosen], chosen);
        await mod.requestUsbPrinter();

        mod.forgetPrinter();
        await Promise.resolve();
        await Promise.resolve();

        // Clearing only the saved id would leave the grant standing, and setup
        // would resolve back to the same device without ever asking again.
        expect(chosen.forgotten).toBe(true);
    });
});

describe('a USB printer Windows will not release', () => {
    it('says what is actually wrong, rather than blaming the paper', async () => {
        const held = makeUsbDevice({
            vendorId: 0x4444,
            productId: 0x4,
            productName: 'POS-80',
            openFails: true,
        });
        const mod = await loadUsbService([held], held);
        await mod.requestUsbPrinter();

        const err = await mod.printBytes(new Uint8Array([1])).catch(e => e);

        expect(err).toBeInstanceOf(mod.PrinterError);
        expect(err.message).toContain('POS-80');
        expect(err.message).toContain('Windows');
        // The code, not the wording, is what the setup wizard branches on to
        // stop offering retries and point at the desktop till instead.
        expect(err.kind).toBe('usb-blocked-windows');
        // The two routes that genuinely print, named where the cashier reads it.
        expect(err.message).toMatch(/desktop app/i);
        // The failure has nothing to do with the roll, and sending someone to
        // check it is how an afternoon disappears.
        expect(err.message).not.toMatch(/paper/i);
    });
});
