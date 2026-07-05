import React from 'react';
import PosIcon from '../sales/PosIcon';

export type PosMode = 'standard' | 'quick';

interface PosModeToggleProps {
    mode: PosMode;
    onChange: (mode: PosMode) => void;
}

/**
 * Segmented control that switches the Point of Sale between the full cart-based
 * checkout ("Standard") and the fast amount-entry keypad ("Quick" — the former
 * standalone Hustle POS, now embedded). Uses global brand tokens so it reads the
 * same in the POS top bar and inside the embedded Quick panel.
 */
const PosModeToggle: React.FC<PosModeToggleProps> = ({ mode, onChange }) => (
    <div className="inline-flex items-center gap-1 rounded-full bg-surface-variant p-1" role="tablist" aria-label="Point of Sale mode">
        {(['standard', 'quick'] as PosMode[]).map((m) => (
            <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => onChange(m)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${mode === m ? 'bg-primary text-white shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}
            >
                <PosIcon name={m === 'standard' ? 'point_of_sale' : 'bolt'} size={16} />
                {m === 'standard' ? 'Standard' : 'Quick'}
            </button>
        ))}
    </div>
);

export default PosModeToggle;
