import ReactGA from "react-ga4";

const GOOGLE_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

export const initGA = () => {
    if (GOOGLE_ANALYTICS_ID) {
        ReactGA.initialize(GOOGLE_ANALYTICS_ID);
        console.log("GA Initialized");
    } else {
        console.warn("Google Analytics ID is missing");
    }
};

export const logEvent = (category: string, action: string, label?: string) => {
    if (GOOGLE_ANALYTICS_ID) {
        ReactGA.event({
            category,
            action,
            label,
        });
    }
};

export const logPageView = (path: string) => {
    if (GOOGLE_ANALYTICS_ID) {
        ReactGA.send({ hitType: "pageview", page: path });
    }
};

export const setUserId = (id: string) => {
    if (GOOGLE_ANALYTICS_ID) {
        ReactGA.set({ userId: id });
    }
};

export const setUserProperties = (properties: any) => {
    if (GOOGLE_ANALYTICS_ID) {
        ReactGA.set(properties);
    }
};
