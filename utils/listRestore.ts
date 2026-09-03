/**
 * Put an item back where it was after an undo.
 *
 * Appending a restored item is the easy version and the wrong one: a cashier
 * reading a cart aloud to a customer should not watch a line jump to the
 * bottom because they undid a mis-tap. The list may also have moved on since
 * the removal, so the index is clamped rather than trusted.
 */
export const restoreAt = <T>(
    list: readonly T[],
    item: T,
    index: number,
    isSame: (candidate: T) => boolean,
): T[] => {
    // Already back — by a manual re-add, or a second click on Undo. Restoring
    // again would duplicate the line and overcharge.
    if (list.some(isSame)) return list as T[];

    const next = [...list];
    next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
    return next;
};
