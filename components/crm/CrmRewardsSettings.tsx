import React, { useState } from 'react';
import { StoreSettings } from '../../types';
import { Icon } from './CrmBits';
import { LoyaltyConfig, formatMoney } from './crmModel';

interface CrmRewardsSettingsProps {
    config: LoyaltyConfig;
    storeSettings?: StoreSettings | null;
    onBack: () => void;
    onSave: (config: LoyaltyConfig) => void;
}

const NumberField: React.FC<{
    label: string; hint?: string; prefix?: string; suffix?: string;
    value: number; min?: number; step?: number; disabled?: boolean;
    onChange: (v: number) => void;
}> = ({ label, hint, prefix, suffix, value, min = 0, step = 1, disabled, onChange }) => {
    const r = 'var(--c-radius)';
    const leftR = prefix ? '0' : r;
    const rightR = suffix ? '0' : r;
    return (
        <div className="crm-input-group">
            <label className="crm-input-group__label">{label}</label>
            <div className="crm-input-affix">
                {prefix && (
                    <span className="crm-input-affix__prefix" style={{ borderRadius: `${r} 0 0 ${r}`, borderRight: 'none' }}>{prefix}</span>
                )}
                <input
                    className="crm-input" type="number" min={min} step={step} disabled={disabled}
                    style={{ borderRadius: `${leftR} ${rightR} ${rightR} ${leftR}` }}
                    value={Number.isFinite(value) ? value : 0}
                    onChange={e => onChange(parseFloat(e.target.value) || 0)}
                />
                {suffix && (
                    <span className="crm-input-affix__prefix" style={{ borderRadius: `0 ${r} ${r} 0`, borderLeft: 'none' }}>{suffix}</span>
                )}
            </div>
            {hint && <p className="crm-input-group__hint">{hint}</p>}
        </div>
    );
};

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string }> = ({ on, onChange, label }) => (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`crm-switch${on ? ' is-on' : ''}`} onClick={() => onChange(!on)}>
        <span className="crm-switch__knob" />
    </button>
);

export const CrmRewardsSettings: React.FC<CrmRewardsSettingsProps> = ({ config, storeSettings, onBack, onSave }) => {
    const [draft, setDraft] = useState<LoyaltyConfig>(config);
    const set = (patch: Partial<LoyaltyConfig>) => setDraft(d => ({ ...d, ...patch }));

    const earnExample = `1 point per ${formatMoney(draft.earnSpendPerPoint, storeSettings)} spent`;
    const redeemExample = `${draft.redeemPointsPerUnit.toLocaleString()} points = ${formatMoney(draft.redeemValuePerUnit, storeSettings)} off`;

    return (
        <main className="crm-main crm-section-fade">
            <nav className="crm-crumbs">
                <button type="button" onClick={onBack}>Loyalty</button>
                <Icon name="chevron_right" size={18} />
                <span className="crm-crumbs__current">Rewards Settings</span>
            </nav>

            <div className="crm-pagehead" style={{ marginBottom: 16 }}>
                <div>
                    <p className="crm-pagehead__eyebrow">Program Configuration</p>
                    <h2 className="crm-pagehead__title">Rewards Settings</h2>
                    <p className="crm-pagehead__sub">One simple model: customers earn points as they spend and redeem them for store credit.</p>
                </div>
            </div>

            <div className="crm-form-fields" style={{ maxWidth: 720 }}>
                {/* Master switch */}
                <section className="crm-form-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                            <h2 className="crm-form-section__title" style={{ marginBottom: 4 }}>Loyalty Program</h2>
                            <p className="crm-input-group__hint" style={{ margin: 0 }}>{draft.enabled ? 'Active — points accrue automatically on every attributed sale.' : 'Paused — no points are earned or redeemable.'}</p>
                        </div>
                        <Toggle on={draft.enabled} onChange={v => set({ enabled: v })} label="Enable loyalty program" />
                    </div>
                </section>

                <fieldset disabled={!draft.enabled} style={{ border: 'none', padding: 0, margin: 0, opacity: draft.enabled ? 1 : 0.55, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Earning */}
                    <section className="crm-form-section">
                        <div className="crm-form-section__head"><h2 className="crm-form-section__title">Earning</h2></div>
                        <NumberField
                            label="Earn rate"
                            prefix={storeSettings?.currency?.symbol ?? '$'}
                            suffix="= 1 pt"
                            value={draft.earnSpendPerPoint}
                            min={1}
                            onChange={v => set({ earnSpendPerPoint: Math.max(1, v) })}
                            hint={earnExample}
                        />
                    </section>

                    {/* Redemption */}
                    <section className="crm-form-section">
                        <div className="crm-form-section__head"><h2 className="crm-form-section__title">Redemption</h2></div>
                        <div className="crm-form-row crm-form-row--2">
                            <NumberField label="Points per redemption" value={draft.redeemPointsPerUnit} min={1} onChange={v => set({ redeemPointsPerUnit: Math.max(1, v) })} suffix="pts" />
                            <NumberField label="Value granted" prefix={storeSettings?.currency?.symbol ?? '$'} value={draft.redeemValuePerUnit} min={0} step={0.5} onChange={v => set({ redeemValuePerUnit: Math.max(0, v) })} />
                        </div>
                        <p className="crm-input-group__hint" style={{ marginTop: -8 }}>{redeemExample}. Redeeming converts points into store credit on the customer's account.</p>
                        <NumberField
                            label="Minimum redeemable balance (optional)"
                            value={draft.minRedeemPoints} min={0} suffix="pts"
                            onChange={v => set({ minRedeemPoints: Math.max(0, v) })}
                            hint="Prevents tiny redemptions. Set to 0 for no minimum."
                        />
                    </section>

                    {/* Expiry */}
                    <section className="crm-form-section">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                            <div>
                                <h2 className="crm-form-section__title" style={{ marginBottom: 4 }}>Point expiry</h2>
                                <p className="crm-input-group__hint" style={{ margin: 0 }}>Optionally expire points after a period of inactivity.</p>
                            </div>
                            <Toggle on={draft.expiryEnabled} onChange={v => set({ expiryEnabled: v })} label="Enable point expiry" />
                        </div>
                        {draft.expiryEnabled && (
                            <NumberField
                                label="Expire after inactivity" value={draft.expiryMonths} min={1} suffix="months"
                                onChange={v => set({ expiryMonths: Math.max(1, v) })}
                                hint={`Points lapse if a customer hasn't purchased in ${draft.expiryMonths} month${draft.expiryMonths === 1 ? '' : 's'}.`}
                            />
                        )}
                    </section>
                </fieldset>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
                    <button type="button" className="crm-btn crm-btn--ghost" style={{ color: 'var(--c-on-surface-variant)', padding: '12px 22px' }} onClick={onBack}>Cancel</button>
                    <button type="button" className="crm-btn crm-btn--primary" style={{ padding: '12px 26px' }} onClick={() => onSave(draft)}>
                        <Icon name="save" size={20} /> Save Settings
                    </button>
                </div>
            </div>
        </main>
    );
};

export default CrmRewardsSettings;
