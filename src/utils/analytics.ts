import ReactGA from "react-ga4";

const GOOGLE_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID as string | undefined;

// Skip analytics on localhost so local development never pollutes production
// metrics — and so the dev console isn't cluttered with GA hits (which also show
// up as blocked-request errors behind tracking blockers).
const isLocalhost = typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

const GA_ENABLED = Boolean(GOOGLE_ANALYTICS_ID) && !isLocalhost;

// Guard against double-initialization (e.g. React StrictMode invoking the mount
// effect twice in development).
let initialized = false;

export const initGA = () => {
    if (!GA_ENABLED || initialized) return;
    ReactGA.initialize(GOOGLE_ANALYTICS_ID!);
    initialized = true;
};

export const logEvent = (category: string, action: string, label?: string) => {
    if (GA_ENABLED) {
        ReactGA.event({
            category,
            action,
            label,
        });
    }
};

/**
 * GA4 custom event with structured params (the upsell engine needs
 * `{ momentId, module, surface }`, which `logEvent`'s category/action/label
 * shape can't carry). Safe no-op when GA is not enabled.
 */
export const trackEvent = (name: string, params: Record<string, string | number | boolean>) => {
    if (GA_ENABLED) {
        ReactGA.event(name, params);
    }
};

export const logPageView = (path: string) => {
    if (GA_ENABLED) {
        ReactGA.send({ hitType: "pageview", page: path });
    }
};

export const setUserId = (id: string) => {
    if (GA_ENABLED) {
        ReactGA.set({ userId: id });
    }
};

export const setUserProperties = (properties: any) => {
    if (GA_ENABLED) {
        ReactGA.set(properties);
    }
};
