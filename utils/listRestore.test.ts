import { describe, expect, it } from 'vitest';
import { restoreAt } from './listRestore';

type Line = { id: string };
const line = (id: string): Line => ({ id });
const by = (id: string) => (c: Line) => c.id === id;

describe('restoreAt', () => {
    it('puts the item back at the position it held, not at the end', () => {
        const after = [line('a'), line('c')];
        expect(restoreAt(after, line('b'), 1, by('b')).map(l => l.id))
            .toEqual(['a', 'b', 'c']);
    });

    it('restores the first line to the front', () => {
        const after = [line('b'), line('c')];
        expect(restoreAt(after, line('a'), 0, by('a')).map(l => l.id))
            .toEqual(['a', 'b', 'c']);
    });

    it('appends when the original index is now past the end', () => {
        // Two more lines were removed while the toast was up.
        const after = [line('a')];
        expect(restoreAt(after, line('d'), 3, by('d')).map(l => l.id))
            .toEqual(['a', 'd']);
    });

    it('does nothing when the item is already back', () => {
        // A second Undo click, or the cashier re-added it by hand.
        const current = [line('a'), line('b')];
        const result = restoreAt(current, line('b'), 1, by('b'));
        expect(result.map(l => l.id)).toEqual(['a', 'b']);
        expect(result).toBe(current);
    });

    it('handles restoring into an empty list', () => {
        expect(restoreAt([], line('a'), 2, by('a')).map(l => l.id)).toEqual(['a']);
    });

    it('clamps a negative index to the front', () => {
        expect(restoreAt([line('b')], line('a'), -5, by('a')).map(l => l.id))
            .toEqual(['a', 'b']);
    });

    it('does not mutate the list it was given', () => {
        const current = [line('a'), line('c')];
        restoreAt(current, line('b'), 1, by('b'));
        expect(current.map(l => l.id)).toEqual(['a', 'c']);
    });
});
