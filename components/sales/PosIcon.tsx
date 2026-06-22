import React from 'react';

interface PosIconProps {
    name: string;
    size?: number;
    /** 0 = outlined, 1 = filled */
    fill?: 0 | 1;
    weight?: number;
    className?: string;
}

/**
 * Material Symbols Rounded icon — mirrors the <Icon> primitive used across
 * salepilot_web_v2. The font is loaded globally in index.html.
 */
export const PosIcon: React.FC<PosIconProps> = ({ name, size = 20, fill = 0, weight = 500, className }) => (
    <span
        className={`material-symbols-rounded${className ? ` ${className}` : ''}`}
        style={{
            fontSize: size,
            fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
        }}
        aria-hidden="true"
    >
        {name}
    </span>
);

export default PosIcon;
