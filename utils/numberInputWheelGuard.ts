/**
 * Stop the mouse wheel from silently editing `<input type="number">` values.
 *
 * Browsers treat a wheel event over a *focused* number input as a value
 * increment. On a long form — the product form, where price, cost price and
 * stock are all number inputs — that means scrolling the page with the cursor
 * resting over a price field rewrites the price, with no prompt and no visual
 * cue. The user then saves a wrong number.
 *
 * Blurring the input on wheel restores the expected behaviour: the page
 * scrolls, the value does not change. The field keeps its value and can simply
 * be clicked again, so nothing is lost by dropping focus.
 *
 * Installed once globally rather than per-input so it also covers number inputs
 * added later, and so no call site has to remember the guard.
 */

const isGuardedNumberInput = (node: EventTarget | null): node is HTMLInputElement =>
    node instanceof HTMLInputElement && node.type === 'number' && !node.readOnly && !node.disabled;

const onWheel = (e: WheelEvent): void => {
    const target = e.target;
    // Only a *focused* number input reacts to the wheel, so that is the only
    // case worth intercepting — scrolling past an unfocused one is harmless.
    if (isGuardedNumberInput(target) && document.activeElement === target) {
        target.blur();
    }
};

let installed = false;

/** Idempotent — safe to call from an effect that may run more than once. */
export const installNumberInputWheelGuard = (): void => {
    if (installed || typeof document === 'undefined') return;
    // Capture phase so the input never sees the event, and passive since the
    // handler only blurs — the scroll itself must go ahead normally.
    document.addEventListener('wheel', onWheel, { capture: true, passive: true });
    installed = true;
};

export const uninstallNumberInputWheelGuard = (): void => {
    if (!installed) return;
    document.removeEventListener('wheel', onWheel, { capture: true });
    installed = false;
};
