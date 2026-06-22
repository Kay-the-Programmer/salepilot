import React from 'react';
import { CustomerMetrics, initials, avatarColor } from './crmModel';

/** Material Symbols Rounded glyph (font loaded globally in index.html). */
export const Icon: React.FC<{ name: string; size?: number; fill?: 0 | 1; weight?: number; className?: string }> = ({
    name, size = 22, fill = 0, weight = 500, className,
}) => (
    <span
        className={`msr${className ? ` ${className}` : ''}`}
        style={{ fontSize: size, fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}` }}
        aria-hidden="true"
    >
        {name}
    </span>
);

interface AvatarProps {
    name?: string;
    src?: string;
    size?: number;
    square?: boolean;
    className?: string;
}

/** Initials avatar with a deterministic warm colour (customers have no photos). */
export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 48, square, className }) => {
    const style: React.CSSProperties = {
        width: size, height: size, fontSize: Math.round(size * 0.36),
        background: avatarColor(name || '?'),
    };
    return (
        <span className={`crm-avatar${square ? ' crm-avatar--sq' : ''}${className ? ` ${className}` : ''}`} style={style}>
            {src ? <img src={src} alt={name || ''} /> : initials(name)}
        </span>
    );
};

const BADGE_ICON: Record<CustomerMetrics['statusBadge'], string> = {
    platinum: 'diamond', gold: 'star', silver: 'workspace_premium', new: 'fiber_new', inactive: 'timer_off',
};

export const TierBadge: React.FC<{ status: CustomerMetrics['statusBadge']; label: string }> = ({ status, label }) => (
    <span className={`crm-badge crm-badge--${status}`}>
        <Icon name={BADGE_ICON[status]} size={14} fill={status === 'gold' || status === 'platinum' ? 1 : 0} />
        {label}
    </span>
);
