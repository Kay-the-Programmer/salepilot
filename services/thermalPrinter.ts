import { PaperWidth } from '../utils/receiptEscPos';

/**
 * Talks to a thermal receipt printer from the browser.
 *
 * The web till only ever had `window.print()`, which hands a rendered page to
 * the OS and can never cut paper or kick a cash drawer. Worse, a raw USB
 * micro-printer with no vendor driver installed does not appear in the OS
 * printer list at all, so there was nothing to select.
 *
 * This is the approach standard POS software uses instead: reach the device
 * directly and write ESC/POS bytes to it. Three ways in, because no single one
 * covers the hardware shops actually buy:
 *
 *  * **Bluetooth** — how every battery-powered pocket printer connects, and the
 *    only transport that exists at all on an Android till.
 *  * **USB** — the counter printer plugged into a laptop, reached by writing to
 *    its bulk OUT endpoint.
 *  * **Serial** — a large share of cheap printers present as USB-serial bridges
 *    (CH340/CP210x) rather than as printer-class devices.
 *
 * Permission is granted once, by the user, through the browser's own device
 * picker. The browser then hands the same device back on later visits with no
 * prompt — which is what makes "choose the printer once" work.
 *
 * Everything funnels through one queue with one reconnect policy (see
 * `printBytes`), because the failures that ruin a shift are not exotic: two
 * receipts sent at once interleaving on the wire, a printer that slept between
 * sales, a roll changed with the lid open. Those are handled here rather than
 * left for each call site to get wrong.
 */

export type PrinterTransport = 'usb' | 'serial' | 'bluetooth';

export interface ConnectedPrinter {
    transport: PrinterTransport;
    label: string;
}

/** What the till can say about its printer without prompting anyone. */
export interface PrinterStatus {
    transport: PrinterTransport | null;
    label: string | null;
    /** A print sent now will reach the printer, connecting first if needed. */
    ready: boolean;
    /**
     * A printer is configured, but the browser will not hand it back without a
     * tap. Chrome only remembers Bluetooth grants across reloads when its
     * persistent-permissions backend is on, so this is the normal state after a
     * refresh on many machines — and the reason the UI offers "Reconnect"
     * rather than claiming there is no printer.
     */
    needsReconnect: boolean;
    /** Charge on a battery-powered printer, when it reports one. */
    batteryPercent: number | null;
}

/**
 * Why a print failed, when the reason changes what the till should offer next.
 *
 * `usb-blocked-windows` is the one that matters: it is not a fault to retry but
 * a wall — Windows owns the device and no browser can take it — so the only
 * useful response is to point at the desktop till, which reaches these printers
 * with nothing installed. Carried as a code rather than sniffed out of the
 * message so the wording stays free to change.
 */
export type PrinterErrorKind = 'usb-blocked-windows';

export class PrinterError extends Error {
    constructor(message: string, readonly kind?: PrinterErrorKind) {
        super(message);
    }
}

const PAPER_KEY = 'salepilot.printer.paperWidth';
const DRAWER_KEY = 'salepilot.printer.openDrawer';
const TRANSPORT_KEY = 'salepilot.printer.transport';
const RECEIPT_BEHAVIOUR_KEY = 'salepilot.printer.receiptBehaviour';
const BT_ID_KEY = 'salepilot.printer.bluetooth.id';
const BT_NAME_KEY = 'salepilot.printer.bluetooth.name';
const BT_CHUNK_KEY = 'salepilot.printer.bluetooth.chunk';
const USB_ID_KEY = 'salepilot.printer.usb.id';

/** USB device class for printers. The filter that finds a receipt printer. */
const USB_PRINTER_CLASS = 0x07;

type USBDeviceLike = any;
type SerialPortLike = any;
type BluetoothDeviceLike = any;

const usb = (): any => (navigator as any).usb;
const serial = (): any => (navigator as any).serial;
const bluetooth = (): any => (navigator as any).bluetooth;

export const isUsbSupported = (): boolean => !!usb();
export const isSerialSupported = (): boolean => !!serial();
export const isBluetoothSupported = (): boolean => !!bluetooth();

/** Whether this browser can drive a thermal printer at all. */
export const isSupported = (): boolean =>
    isUsbSupported() || isSerialSupported() || isBluetoothSupported();

/**
 * Why a browser cannot reach a printer, when it cannot.
 *
 *  * `ios` — no iPhone or iPad can, in any browser. Apple ships none of these
 *    APIs in WebKit, and iOS requires every browser to use WebKit underneath,
 *    so Chrome and Firefox there are Safari wearing a different icon.
 *  * `insecure-context` — the APIs exist but are withheld from pages served
 *    over plain HTTP. This is the recoverable one, and worth telling apart:
 *    a till opened at `http://192.168.1.x` looks exactly as unsupported as an
 *    iPhone, and the fix is one the shop can actually carry out.
 *  * `browser` — everything else, which in practice means an older or
 *    non-Chromium desktop browser.
 */
export type PrinterSupportReason = 'ios' | 'insecure-context' | 'browser';

export const getUnsupportedReason = (): PrinterSupportReason | null => {
    if (isSupported()) return null;
    // Checked before the secure-context test on purpose: HTTPS does not help an
    // iPhone, and telling a shopkeeper to go and fix their certificate when the
    // device could never print would waste a real afternoon.
    if (isIosWebKit()) return 'ios';
    if (!isSecureContext()) return 'insecure-context';
    return 'browser';
};

const isSecureContext = (): boolean => {
    try {
        return window.isSecureContext !== false;
    } catch {
        return true;
    }
};

/** Whether this is an iPhone or iPad, whatever the browser calls itself. */
const isIosWebKit = (): boolean => {
    try {
        const ua = navigator.userAgent || '';
        if (/iPad|iPhone|iPod/.test(ua)) return true;
        // An iPad on iPadOS 13 and later reports itself as a Mac. A desktop Mac
        // has no touch screen, so the touch points are what give it away.
        return /Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
    } catch {
        return false;
    }
};

const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

const readPref = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch {
        // Private mode, or storage disabled. The till still prints for this
        // session; it just forgets the choice, which is not worth throwing over.
        return null;
    }
};

const writePref = (key: string, value: string | null): void => {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch {
        // As above — losing the preference must never lose the sale.
    }
};

// ── Saved preferences (per browser/machine, like the desktop till) ──

export const getPaperWidth = (): PaperWidth => (readPref(PAPER_KEY) === '58' ? 58 : 80);

export const setPaperWidth = (w: PaperWidth): void => writePref(PAPER_KEY, String(w));

export const getOpenDrawer = (): boolean => readPref(DRAWER_KEY) === '1';

export const setOpenDrawer = (on: boolean): void => writePref(DRAWER_KEY, on ? '1' : '0');

/**
 * What the till does with the receipt once a sale is paid.
 *
 * - `ask`    show the receipt dialog and wait to be dismissed (how the till has
 *            always behaved, so it stays the default)
 * - `print`  send it straight to the saved printer and carry on
 * - `skip`   neither — the receipt stays available from the POS menu
 *
 * Per machine rather than per store, like the other printer preferences: one
 * branch has a printer on the counter and the next one does not.
 */
export type ReceiptBehaviour = 'ask' | 'print' | 'skip';

export const getReceiptBehaviour = (): ReceiptBehaviour => {
    const v = readPref(RECEIPT_BEHAVIOUR_KEY);
    return v === 'print' || v === 'skip' ? v : 'ask';
};

export const setReceiptBehaviour = (b: ReceiptBehaviour): void => writePref(RECEIPT_BEHAVIOUR_KEY, b);

const getPreferredTransport = (): PrinterTransport | null => {
    const v = readPref(TRANSPORT_KEY);
    return v === 'usb' || v === 'serial' || v === 'bluetooth' ? v : null;
};

const setPreferredTransport = (t: PrinterTransport | null): void => writePref(TRANSPORT_KEY, t);

/** Forget the printer entirely, so receipts fall back to the browser dialog. */
export const forgetPrinter = (): void => {
    setPreferredTransport(null);
    writePref(BT_ID_KEY, null);
    writePref(BT_NAME_KEY, null);
    writePref(BT_CHUNK_KEY, null);
    writePref(USB_ID_KEY, null);
    disconnectBluetooth();
    revokeUsbGrant();
    serialPort = null;
};

// ── Bluetooth ──

/**
 * GATT services that pocket printers put their write characteristic behind.
 *
 * This list is not decoration: Web Bluetooth refuses access to any service not
 * named up front, so a printer whose service is missing here stays invisible
 * even after the user picks it. Erring long is free; erring short is a printer
 * that connects and then cannot be written to.
 */
const BLE_PRINTER_SERVICES: string[] = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Epson TM-P, Star, and the widest clone family
    '0000ff00-0000-1000-8000-00805f9b34fb', // Goojprt PT-210, Zjiang, most 58mm pocket printers
    '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC254x UART bridges
    '0000ffb0-0000-1000-8000-00805f9b34fb',
    '0000ff80-0000-1000-8000-00805f9b34fb',
    '0000fee7-0000-1000-8000-00805f9b34fb',
    '0000ae30-0000-1000-8000-00805f9b34fb', // Sunmi and relatives
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip / ISSC transparent UART
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Bixolon and others
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service
];

/** Standard battery service — a flat battery is the commonest "it stopped working". */
const BLE_BATTERY_SERVICE = '0000180f-0000-1000-8000-00805f9b34fb';
const BLE_BATTERY_CHARACTERISTIC = '00002a19-0000-1000-8000-00805f9b34fb';

/**
 * Payload sizes to try, largest first.
 *
 * A BLE write larger than the negotiated MTU is rejected outright, and the MTU
 * is not readable from JavaScript — it depends on the phone, the adapter and
 * the printer's own firmware, and ranges from 20 usable bytes to 512. Rather
 * than guess one number and be wrong on half the hardware, the link is
 * calibrated once (see `calibrateChunkSize`) and the answer is remembered.
 */
const BLE_CHUNK_LADDER = [512, 244, 182, 128, 100, 60, 20];

/** Pause between chunks sent without acknowledgement, so the printer's buffer drains. */
const BLE_UNACKED_CHUNK_DELAY_MS = 12;

interface BleLink {
    device: BluetoothDeviceLike;
    characteristic: any;
    /** The characteristic acknowledges each write, which paces the stream for us. */
    withResponse: boolean;
    chunkSize: number;
}

let bleLink: BleLink | null = null;
let bleBatteryPercent: number | null = null;
/** The device the user picked, kept even while disconnected so a retry can reopen it. */
let bleDevice: BluetoothDeviceLike | null = null;

const bleLabel = (device: BluetoothDeviceLike): string =>
    device?.name || readPref(BT_NAME_KEY) || 'Bluetooth printer';

const isBleConnected = (): boolean => !!bleLink?.device?.gatt?.connected;

/**
 * Open the browser's picker so the user can grant a Bluetooth printer.
 *
 * Deliberately unfiltered. Filtering by service UUID shows a shorter, tidier
 * list — and hides most pocket printers, because they advertise a name and
 * nothing else, and the service only becomes visible after connecting. A list
 * the operator has to read beats a list their printer is missing from.
 */
export const requestBluetoothPrinter = async (): Promise<ConnectedPrinter> => {
    if (!isBluetoothSupported()) {
        throw new PrinterError(
            'This browser cannot connect to Bluetooth printers. Use Chrome or Edge, or the SalePilot desktop app.',
        );
    }
    let device: BluetoothDeviceLike;
    try {
        // Called before anything is awaited. Chrome only opens the picker while
        // the user's tap is still "active", and a check made first can spend
        // that activation — so the adapter is only interrogated once this fails.
        device = await bluetooth().requestDevice({
            acceptAllDevices: true,
            optionalServices: [...BLE_PRINTER_SERVICES, BLE_BATTERY_SERVICE],
        });
    } catch {
        throw (await bluetoothIsOff())
            ? new PrinterError('Bluetooth is switched off on this device. Turn it on and try again.')
            : new PrinterError('No printer was selected.');
    }
    if (!device) throw new PrinterError('No printer was selected.');

    bleDevice = device;
    // Connect during setup rather than at the first sale. A printer that cannot
    // be written to must fail here, in settings, where there is time to fix it.
    await openBluetooth(device, { awaitBattery: true });

    setPreferredTransport('bluetooth');
    writePref(BT_ID_KEY, device.id ?? null);
    writePref(BT_NAME_KEY, device.name ?? null);
    return { transport: 'bluetooth', label: bleLabel(device) };
};

/**
 * Whether the adapter is definitively off, so a failure can be explained.
 *
 * Only ever answers true when the browser says so outright: `getAvailability`
 * is not implemented everywhere, and its absence says nothing about the adapter.
 */
const bluetoothIsOff = async (): Promise<boolean> => {
    try {
        return (await bluetooth().getAvailability?.()) === false;
    } catch {
        return false;
    }
};

/**
 * Connect, find the characteristic to write receipts to, and size the writes.
 *
 * BLE connects fail transiently far more often than a cable does — the printer
 * is asleep, or the adapter is mid-scan — and the same call usually succeeds a
 * moment later. Retrying here is the difference between a printer that "never
 * works" and one that works every time.
 */
const openBluetooth = async (
    device: BluetoothDeviceLike,
    // Setup waits for the charge reading so it can be shown and warned about;
    // a receipt mid-sale does not, because no reading is worth delaying one.
    { awaitBattery = false }: { awaitBattery?: boolean } = {},
): Promise<BleLink> => {
    const existing = bleLink;
    if (existing && existing.device === device && device.gatt?.connected) return existing;

    device.removeEventListener?.('gattserverdisconnected', onBleDisconnected);
    device.addEventListener?.('gattserverdisconnected', onBleDisconnected);

    let server: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            server = device.gatt?.connected ? device.gatt : await device.gatt?.connect();
            if (server) break;
        } catch {
            await sleep(300 * (attempt + 1));
        }
    }
    if (!server) {
        throw new PrinterError(
            `Could not connect to ${bleLabel(device)}. Check it is switched on, charged, and in range.`,
        );
    }

    const characteristic = await findWritableCharacteristic(server, device);
    const withResponse = !!characteristic.properties?.write;

    const saved = Number(readPref(BT_CHUNK_KEY));
    const chunkSize = BLE_CHUNK_LADDER.includes(saved)
        ? saved
        : await calibrateChunkSize(characteristic, withResponse);
    writePref(BT_CHUNK_KEY, String(chunkSize));

    bleLink = { device, characteristic, withResponse, chunkSize };
    bleDevice = device;
    const battery = readBleBattery(server);
    if (awaitBattery) await battery;
    return bleLink;
};

const onBleDisconnected = (): void => {
    // Drop the link but keep the device: the next print reopens it without
    // asking the operator to pick the printer again.
    bleLink = null;
    bleBatteryPercent = null;
};

/**
 * The characteristic a receipt goes to.
 *
 * Known services are tried in order first because they are known to be the
 * print pipe. Failing that, every service the grant exposes is swept for
 * anything writable — clone firmware puts the pipe behind vendor UUIDs that no
 * list will ever fully cover, and a writable characteristic on a printer is, in
 * practice, the print pipe.
 */
const findWritableCharacteristic = async (
    server: any,
    device: BluetoothDeviceLike,
): Promise<any> => {
    const writable = (c: any) => !!(c.properties?.write || c.properties?.writeWithoutResponse);

    for (const uuid of BLE_PRINTER_SERVICES) {
        try {
            const service = await server.getPrimaryService(uuid);
            const found = (await service.getCharacteristics()).filter(writable);
            if (found.length) return preferWithResponse(found);
        } catch {
            // This printer does not expose that service. Expected for all but one.
        }
    }

    try {
        for (const service of await server.getPrimaryServices()) {
            if (service.uuid === BLE_BATTERY_SERVICE) continue;
            const found = (await service.getCharacteristics()).filter(writable);
            if (found.length) return preferWithResponse(found);
        }
    } catch {
        // Enumeration is blocked unless the service was declared up front, so
        // this can legitimately find nothing.
    }

    throw new PrinterError(
        `${bleLabel(device)} connected, but does not accept receipts. It may be a phone or a speaker ` +
            'rather than a printer — pick the printer from the list, or connect it over USB instead.',
    );
};

/** Acknowledged writes give real flow control, so they win when both are offered. */
const preferWithResponse = (characteristics: any[]): any =>
    characteristics.find(c => c.properties?.write) ?? characteristics[0];

/**
 * Find the largest write this link accepts, without printing anything.
 *
 * The probe is a run of `ESC @` — printer reset. A printer that receives it
 * initialises and feeds no paper, so calibration costs nothing visible, while a
 * chunk larger than the MTU fails immediately and loudly here rather than
 * silently truncating a customer's receipt later.
 */
const calibrateChunkSize = async (characteristic: any, withResponse: boolean): Promise<number> => {
    // An unacknowledged write cannot exceed the MTU at all, so there is no point
    // probing the sizes only a long (acknowledged) write can carry.
    const ladder = withResponse ? BLE_CHUNK_LADDER : BLE_CHUNK_LADDER.filter(n => n <= 244);
    for (const size of ladder) {
        try {
            await writeChunk(characteristic, withResponse, resetProbe(size));
            return size;
        } catch {
            // Too large for this link. Step down.
        }
    }
    // Nothing got through. 20 bytes is the floor every BLE link supports; if
    // that fails too, the write path will surface the real error.
    return 20;
};

/** `size` bytes of ESC @ — a reset the printer obeys without moving paper. */
export const resetProbe = (size: number): Uint8Array => {
    const probe = new Uint8Array(size);
    for (let i = 0; i + 1 < size; i += 2) {
        probe[i] = 0x1b;
        probe[i + 1] = 0x40;
    }
    // An odd size would leave a lone ESC, which swallows the next byte of the
    // following write. Pad with a line feed the printer can safely ignore.
    if (size % 2 === 1) probe[size - 1] = 0x0a;
    return probe;
};

const writeChunk = async (
    characteristic: any,
    withResponse: boolean,
    chunk: Uint8Array,
): Promise<void> => {
    if (withResponse && characteristic.writeValueWithResponse) {
        return characteristic.writeValueWithResponse(chunk);
    }
    if (!withResponse && characteristic.writeValueWithoutResponse) {
        return characteristic.writeValueWithoutResponse(chunk);
    }
    // Older Chrome exposes only the untyped call.
    return characteristic.writeValue(chunk);
};

/** Split a receipt into writes the link can carry. */
export const chunkBytes = (bytes: Uint8Array, size: number): Uint8Array[] => {
    const step = Math.max(1, Math.floor(size));
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < bytes.length; i += step) {
        chunks.push(bytes.subarray(i, Math.min(i + step, bytes.length)));
    }
    return chunks;
};

const writeBluetooth = async (bytes: Uint8Array): Promise<void> => {
    const device = bleDevice ?? (await grantedBleDevice());
    if (!device) {
        throw new PrinterError('No Bluetooth printer is connected. Open Receipt printer settings to reconnect.');
    }

    const link = isBleConnected() && bleLink ? bleLink : await openBluetooth(device);

    for (const chunk of chunkBytes(bytes, link.chunkSize)) {
        await writeChunk(link.characteristic, link.withResponse, chunk);
        // Without acknowledgement there is nothing pacing the stream, and a
        // printer whose buffer overruns drops bytes mid-receipt rather than
        // reporting an error — the worst failure of the lot, because the
        // cashier hands over a receipt that is quietly missing lines.
        if (!link.withResponse) await sleep(BLE_UNACKED_CHUNK_DELAY_MS);
    }
};

/** A Bluetooth printer this origin was already granted, without prompting. */
const grantedBleDevice = async (): Promise<BluetoothDeviceLike | null> => {
    if (bleDevice) return bleDevice;
    if (!isBluetoothSupported()) return null;
    const savedId = readPref(BT_ID_KEY);
    if (!savedId) return null;
    try {
        // Only present when Chrome's persistent-permissions backend is enabled.
        const devices = await bluetooth().getDevices?.();
        const match = devices?.find((d: any) => d.id === savedId) ?? null;
        if (match) bleDevice = match;
        return match;
    } catch {
        return null;
    }
};

const disconnectBluetooth = (): void => {
    try {
        bleLink?.device?.gatt?.disconnect?.();
    } catch {
        // Best-effort: the point is only to drop the handle.
    }
    bleLink = null;
    bleDevice = null;
    bleBatteryPercent = null;
};

/** How long setup will wait for a charge reading before giving up on it. */
const BLE_BATTERY_TIMEOUT_MS = 1500;

/** Best-effort battery read, so settings can warn before the printer dies mid-shift. */
const readBleBattery = async (server: any): Promise<void> => {
    try {
        const read = (async () => {
            const service = await server.getPrimaryService(BLE_BATTERY_SERVICE);
            const characteristic = await service.getCharacteristic(BLE_BATTERY_CHARACTERISTIC);
            return (await characteristic.readValue()).getUint8(0) as number;
        })();
        // Bounded: a device that advertises the service and then never answers
        // must not hold up the one screen the operator is waiting on.
        bleBatteryPercent = await Promise.race([
            read,
            sleep(BLE_BATTERY_TIMEOUT_MS).then(() => null),
        ]);
    } catch {
        // Most printers do not implement it. Absence is not a fault.
        bleBatteryPercent = null;
    }
};

// ── USB ──

const usbLabel = (device: USBDeviceLike): string =>
    device.productName ||
    `USB printer ${String(device.vendorId ?? 0).padStart(4, '0')}:${String(device.productId ?? 0).padStart(4, '0')}`;

/** How a granted device is recognised again later: vendor and product id. */
const usbKey = (device: USBDeviceLike): string => `${device.vendorId}:${device.productId}`;

/**
 * A device already granted to this origin, if any.
 *
 * This is what makes the choice stick: the browser remembers the grant, so a
 * reload or a new shift finds the printer without prompting anyone.
 *
 * The saved id is consulted first, because `getDevices()` returns every device
 * this origin was ever granted — not just the printer. Guessing among them
 * (the printer-class one, else the first) picks wrong for the clones that
 * declare class 0xFF, and then every receipt goes to whatever else was granted
 * once and never came back. Remembering which device the cashier actually
 * chose is the only thing that makes the choice mean anything.
 */
const grantedUsbDevice = async (): Promise<USBDeviceLike | null> => {
    if (!isUsbSupported()) return null;
    try {
        const devices = await usb().getDevices();
        if (!devices?.length) return null;
        const saved = readPref(USB_ID_KEY);
        if (saved) {
            const chosen = devices.find((d: USBDeviceLike) => usbKey(d) === saved);
            // Only fall through when the saved printer is genuinely absent —
            // unplugged, or its grant revoked from the browser's own settings.
            if (chosen) return chosen;
        }
        // No saved choice: a till set up before the id was recorded. Prefer one
        // that actually declares itself a printer.
        return devices.find(isPrinterClass) ?? devices[0];
    } catch {
        return null;
    }
};

const isPrinterClass = (device: USBDeviceLike): boolean => {
    if (device.deviceClass === USB_PRINTER_CLASS) return true;
    // Most printers declare the class on the interface rather than the device,
    // so the interface list is the reliable place to look.
    return (device.configurations ?? []).some((c: any) =>
        (c.interfaces ?? []).some((i: any) =>
            (i.alternates ?? []).some((a: any) => a.interfaceClass === USB_PRINTER_CLASS),
        ),
    );
};

/** Open the browser's picker so the user can grant a USB printer. */
export const requestUsbPrinter = async (): Promise<ConnectedPrinter> => {
    if (!isUsbSupported()) {
        throw new PrinterError('This browser cannot connect to USB printers. Use Chrome or Edge.');
    }
    let device: USBDeviceLike;
    try {
        device = await usb().requestDevice({ filters: [{ classCode: USB_PRINTER_CLASS }] });
    } catch {
        // The filtered picker shows nothing for printers that declare their
        // class only on the interface, which the picker cannot see. Falling
        // back to an unfiltered list is what makes those selectable at all.
        try {
            device = await usb().requestDevice({ filters: [] });
        } catch {
            throw new PrinterError('No printer was selected.');
        }
    }
    if (!device) throw new PrinterError('No printer was selected.');
    setPreferredTransport('usb');
    // Record which device this is, so later sales write to the one that was
    // picked rather than to whatever else this origin happens to hold a grant
    // for. Without this the choice is decoration.
    writePref(USB_ID_KEY, usbKey(device));
    return { transport: 'usb', label: usbLabel(device) };
};

const isWindows = (): boolean => {
    try {
        return /Windows/.test(navigator.userAgent || '');
    } catch {
        return false;
    }
};

/**
 * What to say when the browser is refused the device.
 *
 * This is the failure that actually stops tills, and it deserves the truth
 * rather than an encouraging guess. Windows binds `usbprint.sys` to anything
 * that identifies as a printer, and Chrome can only reach a USB device bound to
 * WinUSB — so a working counter printer is, by virtue of working, unreachable
 * from a web page. No amount of retrying, replugging or checking the paper
 * changes that, and the previous advice here — remove it from Printers &
 * scanners — does not unbind the driver either, so it sent people to do
 * something that could not have helped.
 *
 * The two routes below are the ones that genuinely print, so they are the ones
 * named. Elsewhere the cause is usually another program holding the device, so
 * the message says that instead.
 */
const usbBlockedMessage = (device: USBDeviceLike, err?: unknown): string => {
    const name = usbLabel(device);
    if (isWindows()) {
        return (
            `Windows will not let the browser use ${name}. A receipt printer installed in Windows ` +
            'is held by the system driver, and a web page can never take it from there. ' +
            'Use the SalePilot desktop app, which prints through Windows itself — and make sure the ' +
            'printer is listed in Printers & scanners, as the desktop app prints to it by name.'
        );
    }
    const detail = err instanceof Error && err.name === 'SecurityError'
        ? ' The browser blocked access to it.'
        : ' Another program may be using it.';
    return `Could not open ${name}.${detail} Close any other till software and try again.`;
};

/**
 * Claim the printer and hand back the endpoint to write to.
 *
 * Picks the interface that declares the printer class, falling back to the
 * first one exposing a bulk OUT endpoint — some clones declare class 0xFF
 * (vendor-specific) but are otherwise ordinary ESC/POS printers.
 */
const claimUsb = async (device: USBDeviceLike): Promise<number> => {
    // Opening is where the commonest failure of all lands, and it must not be
    // left to escape as a raw DOMException: `printBytes` would report it as
    // "check it is on, has paper, and is in range", sending the shopkeeper to
    // inspect a paper roll on a printer whose roll is fine. On Windows the
    // system binds its own driver to anything that identifies as a printer, and
    // a bound device is one the browser is refused outright.
    try {
        if (!device.opened) await device.open();
        if (!device.configuration) await device.selectConfiguration(1);
    } catch (err) {
        throw new PrinterError(
            usbBlockedMessage(device, err),
            isWindows() ? 'usb-blocked-windows' : undefined,
        );
    }

    const interfaces = device.configuration?.interfaces ?? [];
    const findEndpoint = (iface: any): number | null => {
        for (const alt of iface.alternates ?? []) {
            const ep = (alt.endpoints ?? []).find(
                (e: any) => e.direction === 'out' && e.type === 'bulk',
            );
            if (ep) return ep.endpointNumber;
        }
        return null;
    };

    const ordered = [
        ...interfaces.filter((i: any) =>
            (i.alternates ?? []).some((a: any) => a.interfaceClass === USB_PRINTER_CLASS),
        ),
        ...interfaces,
    ];

    for (const iface of ordered) {
        const endpoint = findEndpoint(iface);
        if (endpoint == null) continue;
        try {
            await device.claimInterface(iface.interfaceNumber);
            return endpoint;
        } catch {
            // Windows binds its own driver to a printer installed the normal
            // way, and the browser cannot take it from there. Other interfaces
            // may still be claimable, so this keeps looking.
            continue;
        }
    }
    throw new PrinterError(
        usbBlockedMessage(device),
        isWindows() ? 'usb-blocked-windows' : undefined,
    );
};

const writeUsb = async (bytes: Uint8Array): Promise<void> => {
    const device = await grantedUsbDevice();
    if (!device) throw new PrinterError('No USB printer is connected.');
    const endpoint = await claimUsb(device);
    const result = await device.transferOut(endpoint, bytes);
    if (result?.status && result.status !== 'ok') {
        throw new PrinterError(`${usbLabel(device)} rejected the receipt (${result.status}).`);
    }
};

/**
 * Hand the grant back to the browser, so "Forget printer" really forgets.
 *
 * Clearing the saved id alone would leave the grant standing, and the next
 * setup would resolve straight back to the same device without asking — which
 * is exactly the trap for someone who picked the wrong one from the unfiltered
 * picker and is trying to correct it. Best-effort: `forget()` is recent, and an
 * older Chrome simply keeps the grant.
 */
const revokeUsbGrant = (): void => {
    void (async () => {
        try {
            const device = await grantedUsbDevice();
            if (device?.opened) await device.close();
            await device?.forget?.();
        } catch {
            // Nothing here is worth failing a settings click over.
        }
    })();
};

/** Release the device so the next attempt starts from a clean handle. */
const resetUsb = async (): Promise<void> => {
    const device = await grantedUsbDevice();
    if (!device?.opened) return;
    try {
        await device.close();
    } catch {
        // Closing is best-effort — the point is only to drop a stale handle.
    }
};

// ── Serial ──

let serialPort: SerialPortLike | null = null;

export const requestSerialPrinter = async (): Promise<ConnectedPrinter> => {
    if (!isSerialSupported()) {
        throw new PrinterError('This browser cannot connect to serial printers. Use Chrome or Edge.');
    }
    try {
        serialPort = await serial().requestPort();
    } catch {
        throw new PrinterError('No printer was selected.');
    }
    setPreferredTransport('serial');
    return { transport: 'serial', label: serialLabel(serialPort) };
};

const serialLabel = (port: SerialPortLike): string => {
    const info = port?.getInfo?.() ?? {};
    return info.usbVendorId
        ? `Serial printer ${info.usbVendorId}:${info.usbProductId}`
        : 'Serial printer';
};

const grantedSerialPort = async (): Promise<SerialPortLike | null> => {
    if (serialPort) return serialPort;
    if (!isSerialSupported()) return null;
    try {
        const ports = await serial().getPorts();
        serialPort = ports?.[0] ?? null;
        return serialPort;
    } catch {
        return null;
    }
};

const writeSerial = async (bytes: Uint8Array): Promise<void> => {
    const port = await grantedSerialPort();
    if (!port) throw new PrinterError('No serial printer is connected.');

    // 9600 is the near-universal default for these printers; one set faster
    // still accepts it, it just prints no quicker. Opening an already-open port
    // throws, which is not an error worth surfacing — the goal is only to be
    // sure it is open before writing.
    if (!port.writable) {
        try {
            await port.open({ baudRate: 9600 });
        } catch {
            throw new PrinterError(
                'Could not open the serial printer. Close any other program using the COM port and try again.',
            );
        }
    }
    if (!port.writable) {
        throw new PrinterError('The serial printer is not accepting data. Check it is switched on.');
    }

    const writer = port.writable.getWriter();
    try {
        await writer.write(bytes);
    } catch {
        throw new PrinterError('Could not send the receipt to the serial printer. Check it is on and has paper.');
    } finally {
        writer.releaseLock();
    }
};

const resetSerial = async (): Promise<void> => {
    const port = serialPort;
    if (!port) return;
    try {
        await port.close();
    } catch {
        // Best-effort; the next write reopens it.
    }
};

// ── Public surface ──

/**
 * Everything the UI needs to describe the printer, resolved without prompting.
 *
 * `needsReconnect` is the case worth keeping separate: a Bluetooth printer set
 * up and then lost to a page reload is not the same as no printer, and telling
 * the cashier "no printer" when one tap would restore it is how tills end up
 * back on the browser print dialog for good.
 */
export const getPrinterStatus = async (): Promise<PrinterStatus> => {
    const preferred = getPreferredTransport();

    if (preferred === 'bluetooth') {
        const device = await grantedBleDevice();
        return {
            transport: 'bluetooth',
            label: device ? bleLabel(device) : readPref(BT_NAME_KEY) || 'Bluetooth printer',
            ready: !!device,
            needsReconnect: !device,
            batteryPercent: bleBatteryPercent,
        };
    }

    if (preferred === 'serial') {
        const port = await grantedSerialPort();
        return {
            transport: 'serial',
            label: port ? serialLabel(port) : 'Serial printer',
            ready: !!port,
            needsReconnect: !port,
            batteryPercent: null,
        };
    }

    if (preferred === 'usb') {
        const device = await grantedUsbDevice();
        return {
            transport: 'usb',
            label: device ? usbLabel(device) : 'USB printer',
            ready: !!device,
            needsReconnect: !device,
            batteryPercent: null,
        };
    }

    // No stated preference — report whatever has already been granted, so a
    // till set up before this preference existed still works.
    const device = await grantedUsbDevice();
    if (device) {
        return { transport: 'usb', label: usbLabel(device), ready: true, needsReconnect: false, batteryPercent: null };
    }
    const port = await grantedSerialPort();
    if (port) {
        return { transport: 'serial', label: serialLabel(port), ready: true, needsReconnect: false, batteryPercent: null };
    }
    return { transport: null, label: null, ready: false, needsReconnect: false, batteryPercent: null };
};

/**
 * Re-open the saved printer, from a user gesture.
 *
 * Bluetooth grants do not always survive a reload, and `requestDevice` may only
 * be called from a gesture — so this is deliberately something a button calls,
 * not something the page does on load.
 */
export const reconnect = async (): Promise<ConnectedPrinter> => {
    const preferred = getPreferredTransport();
    if (preferred === 'bluetooth') {
        const device = await grantedBleDevice();
        if (!device) return requestBluetoothPrinter();
        await openBluetooth(device, { awaitBattery: true });
        return { transport: 'bluetooth', label: bleLabel(device) };
    }
    if (preferred === 'serial') return requestSerialPrinter();
    if (preferred === 'usb') return requestUsbPrinter();
    throw new PrinterError('No printer has been set up yet.');
};

/** Drop the live handle so the next attempt starts from a clean connection. */
const resetTransport = async (transport: PrinterTransport): Promise<void> => {
    if (transport === 'bluetooth') {
        // Keep the device — only the GATT link is stale — so the retry
        // reconnects instead of asking for the printer to be picked again.
        bleLink = null;
        return;
    }
    if (transport === 'serial') return resetSerial();
    return resetUsb();
};

const writeTo = (transport: PrinterTransport, bytes: Uint8Array): Promise<void> => {
    if (transport === 'bluetooth') return writeBluetooth(bytes);
    if (transport === 'serial') return writeSerial(bytes);
    return writeUsb(bytes);
};

/**
 * One job on the wire at a time.
 *
 * ESC/POS is a stream with no framing: if a reprint is fired while a receipt is
 * still going out, the two interleave and both print as nonsense. Serialising
 * costs nothing on a till that prints one receipt at a time, and removes the
 * failure entirely on one that does not.
 */
let queue: Promise<unknown> = Promise.resolve();

export const enqueuePrintJob = <T>(job: () => Promise<T>): Promise<T> => {
    const run = queue.then(job, job);
    // Keep the chain alive after a failed job, and do not leave the rejection
    // unhandled here — the caller already owns it.
    queue = run.catch(() => undefined);
    return run;
};

/**
 * Send raw ESC/POS bytes to whichever printer is connected.
 *
 * Retried once through a fresh connection. This is not defensive padding: a
 * printer that slept between sales, was power-cycled, or had its roll changed
 * leaves a stale handle whose first write fails and whose second succeeds. That
 * single retry is the difference between a cashier who never thinks about the
 * printer and one who reconnects it several times a day.
 */
export const printBytes = async (bytes: Uint8Array): Promise<void> =>
    enqueuePrintJob(async () => {
        const status = await getPrinterStatus();
        if (!status.transport) throw new PrinterError('No thermal printer is connected.');
        if (!status.ready) {
            throw new PrinterError(
                `${status.label} is not connected. Open Receipt printer settings and tap Reconnect.`,
            );
        }

        const transport = status.transport;
        try {
            await writeTo(transport, bytes);
        } catch (first) {
            await resetTransport(transport);
            try {
                await writeTo(transport, bytes);
            } catch {
                throw first instanceof PrinterError
                    ? first
                    : new PrinterError(
                          `Could not reach ${status.label}. Check it is on, has paper, and is in range.`,
                      );
            }
        }
    });
