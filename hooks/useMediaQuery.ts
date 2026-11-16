import { useEffect, useState } from 'react';

/** Live result of a CSS media query; false where matchMedia is unavailable. */
export function useMediaQuery(query: string): boolean {
    const get = () => {
        try { return window.matchMedia(query).matches; } catch { return false; }
    };
    const [matches, setMatches] = useState<boolean>(get);

    useEffect(() => {
        let mql: MediaQueryList;
        try { mql = window.matchMedia(query); } catch { return; }
        const onChange = () => setMatches(mql.matches);
        onChange();
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [query]);

    return matches;
}
