import React from 'react';

/**
 * Subtle, on-brand animated illustrations for the registration wizard steps.
 *
 * Line-art style matching the app's outline icons; navy = fill/stroke-primary,
 * orange accents = fill/stroke-secondary (both are brand tokens, so they adapt
 * to light/dark). Animation is gentle (slow floats, soft pulses, a single
 * radar ping) to keep the "calm efficiency" DESIGN.md ethos — no bouncing.
 */

export type StepArtKey = 'account' | 'otp' | 'store' | 'type' | 'location';

const SVG: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <svg viewBox="0 0 96 96" className="w-full h-full" fill="none" aria-hidden="true">
        {children}
    </svg>
);

const Account = () => (
    <SVG>
        {/* Soft pulsing halo */}
        <circle cx="48" cy="46" r="28" className="stroke-secondary" strokeWidth={2} opacity={0.5}>
            <animate attributeName="r" values="24;32;24" dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2.6s" repeatCount="indefinite" />
        </circle>
        {/* Head + shoulders */}
        <circle cx="48" cy="40" r="10" className="stroke-primary" strokeWidth={3} />
        <path d="M31 66 a17 17 0 0 1 34 0" className="stroke-primary" strokeWidth={3} strokeLinecap="round" />
        {/* Orange check badge */}
        <circle cx="65" cy="60" r="9" className="fill-secondary" />
        <path d="M61 60 l3 3 l5 -6" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="16" strokeDashoffset="16">
            <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.5s" begin="0.35s" fill="freeze" />
        </path>
    </SVG>
);

const Otp = () => (
    <SVG>
        <g>
            <animateTransform attributeName="transform" type="translate" values="0 0; 0 -3; 0 0" dur="3s" repeatCount="indefinite" />
            <rect x="26" y="34" width="44" height="30" rx="4" className="stroke-primary" strokeWidth={3} />
            <path d="M28 38 l20 15 l20 -15" className="stroke-primary" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {/* Notification dot */}
        <circle cx="68" cy="34" r="7" className="fill-secondary">
            <animate attributeName="opacity" values="1;0.35;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
    </SVG>
);

const Store = () => (
    <SVG>
        <g>
            <animateTransform attributeName="transform" type="translate" values="0 0; 0 -2.5; 0 0" dur="3.2s" repeatCount="indefinite" />
            {/* Awning */}
            <path d="M26 40 l4 -8 h36 l4 8 z" className="fill-secondary" />
            <path d="M38 32 v8 M50 32 v8 M62 32 v8" stroke="#fff" strokeWidth={1.5} opacity={0.7} />
            {/* Body */}
            <rect x="30" y="40" width="36" height="30" className="stroke-primary" strokeWidth={3} />
            {/* Door */}
            <path d="M42 70 v-14 h12 v14" className="stroke-primary" strokeWidth={3} strokeLinejoin="round" />
        </g>
    </SVG>
);

const Type = () => (
    <SVG>
        <g className="stroke-primary" strokeWidth={3}>
            <rect x="26" y="26" width="18" height="18" rx="3">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" begin="0s" repeatCount="indefinite" />
            </rect>
            <rect x="52" y="26" width="18" height="18" rx="3">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" begin="0.3s" repeatCount="indefinite" />
            </rect>
            <rect x="26" y="52" width="18" height="18" rx="3">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" begin="0.6s" repeatCount="indefinite" />
            </rect>
        </g>
        {/* Orange highlighted tile */}
        <rect x="52" y="52" width="18" height="18" rx="3" className="fill-secondary">
            <animate attributeName="opacity" values="0.55;1;0.55" dur="2.4s" begin="0.9s" repeatCount="indefinite" />
        </rect>
    </SVG>
);

const Location = () => (
    <SVG>
        {/* Radar ping */}
        <circle cx="48" cy="62" r="5" className="stroke-secondary" strokeWidth={2}>
            <animate attributeName="r" values="4;20" dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0" dur="2.1s" repeatCount="indefinite" />
        </circle>
        {/* Pin (gentle bob) */}
        <g>
            <animateTransform attributeName="transform" type="translate" values="0 -3; 0 1; 0 -3" dur="2.8s" repeatCount="indefinite" />
            <path d="M48 22 c-10 0 -18 8 -18 18 c0 13 18 28 18 28 c0 0 18 -15 18 -28 c0 -10 -8 -18 -18 -18 z"
                className="stroke-primary" strokeWidth={3} strokeLinejoin="round" />
            <circle cx="48" cy="40" r="6" className="fill-secondary" />
        </g>
    </SVG>
);

const ART: Record<StepArtKey, React.FC> = {
    account: Account,
    otp: Otp,
    store: Store,
    type: Type,
    location: Location,
};

export const StepArt: React.FC<{ step: StepArtKey }> = ({ step }) => {
    const Art = ART[step] || Account;
    return (
        <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-brand-border flex items-center justify-center p-3">
                <Art />
            </div>
        </div>
    );
};

export default StepArt;
