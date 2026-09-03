import React, { useEffect, useMemo, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { COLUMNS } from '../../utils/escpos';
import { PaperWidth } from '../../utils/receiptEscPos';
import { decodeReceipt, trimTrailingBlanks, PreviewLine } from '../../utils/receiptPreview';

/**
 * Draws a receipt on screen from the bytes the printer would be sent.
 *
 * Every rule about how a receipt lays out — 32 columns on a 58mm roll, 48 on an
 * 80mm one, where the wrapping falls, which lines are double-width — already
 * lives in the builder and has been checked against real hardware. Redrawing
 * that here in HTML would be writing the same rules a second time in a place
 * where nothing checks them, so instead the stream is decoded and the answer
 * simply rendered.
 *
 * The width is set in `ch` units against a monospace face, which makes the
 * screen grid the printer's grid: a line that fits here fits on the roll, and
 * one that would wrap on paper wraps here too.
 */

interface ReceiptPaperProps {
    bytes: Uint8Array;
    paperWidth: PaperWidth;
    /** Shown in place of the receipt when there is nothing to draw yet. */
    emptyLabel?: string;
    className?: string;
}

/** The real symbol, so the preview is not promising a barcode it cannot draw. */
const Barcode: React.FC<{ value: string }> = ({ value }) => {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!ref.current || !value) return;
        try {
            JsBarcode(ref.current, value, {
                format: 'CODE128',
                displayValue: true,
                margin: 0,
                height: 34,
                width: 1.4,
                fontSize: 11,
                textMargin: 2,
                background: 'transparent',
                lineColor: '#111827',
            });
            // The app's global stylesheet sizes every `svg` at 1em so icon
            // fonts behave, which flattens a generated barcode to a 16px
            // square. JsBarcode writes the real size onto the attributes, so
            // it is promoted to an inline style, which outranks the rule.
            const svg = ref.current;
            const width = svg.getAttribute('width');
            const height = svg.getAttribute('height');
            if (width) svg.style.width = width;
            if (height) svg.style.height = height;
            svg.style.maxWidth = '100%';
        } catch {
            // A payload this build cannot draw is not worth breaking the
            // preview over — the receipt still prints, and the digits below
            // carry the same information.
        }
    }, [value]);

    return <svg ref={ref} role="img" aria-label={`Barcode ${value}`} className="max-w-full" />;
};

const alignClass = (align: PreviewLine['align']): string =>
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

const ReceiptPaper: React.FC<ReceiptPaperProps> = ({ bytes, paperWidth, emptyLabel, className }) => {
    const columns = COLUMNS[paperWidth];

    const lines = useMemo(
        () => (bytes.length ? trimTrailingBlanks(decodeReceipt(bytes).lines) : []),
        [bytes],
    );

    return (
        <div className={`flex justify-center ${className ?? ''}`}>
            <div
                // The paper itself is deliberately always light: a thermal roll
                // is white in a dark shop too, and a "dark mode receipt" would
                // misrepresent the thing being previewed.
                className="bg-white text-gray-900 shadow-lg rounded-sm px-3 py-4 overflow-x-auto"
                style={{ width: `calc(${columns}ch + 1.5rem)`, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
            >
                {lines.length === 0 ? (
                    <p className="text-center text-[11px] leading-5 text-gray-400 py-6">
                        {emptyLabel ?? 'Nothing to show yet.'}
                    </p>
                ) : (
                    lines.map((line, i) =>
                        line.kind === 'barcode' ? (
                            <div key={i} className={`my-1 ${alignClass(line.align)}`}>
                                <Barcode value={line.value} />
                            </div>
                        ) : (
                            <div
                                key={i}
                                className={`${alignClass(line.align)} ${line.bold ? 'font-bold' : ''} whitespace-pre-wrap`}
                                style={{
                                    // A printer has nowhere to put an overlong
                                    // line but the next one, so the preview
                                    // wraps rather than scrolling sideways —
                                    // otherwise a too-long shop name looks fine
                                    // here and arrives broken on the roll.
                                    overflowWrap: 'anywhere',
                                    // Double-size glyphs really are twice as
                                    // wide and tall on the roll, so half as many
                                    // fit — showing them at normal size would
                                    // make an overlong total look fine here and
                                    // wrap on paper.
                                    fontSize: line.double ? '1.55em' : '0.8125em',
                                    lineHeight: line.double ? 1.25 : 1.45,
                                    minHeight: line.text ? undefined : '0.6em',
                                }}
                            >
                                {line.text || ' '}
                            </div>
                        ),
                    )
                )}
            </div>
        </div>
    );
};

export default ReceiptPaper;
