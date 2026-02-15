import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logPageView } from "../utils/analytics";

const usePageTracking = () => {
    let location: ReturnType<typeof useLocation> | null = null;
    try {
        location = useLocation();
    } catch {
        // Router context not available (e.g. during HMR)
        return;
    }

    useEffect(() => {
        if (location) {
            logPageView(location.pathname + location.search);
        }
    }, [location]);
};

export default usePageTracking;
