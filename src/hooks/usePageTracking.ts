import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logPageView, setUserId, setUserProperties } from "../utils/analytics";
import { getCurrentUser } from "../../services/authService";

const usePageTracking = () => {
    const location = useLocation();

    useEffect(() => {
        if (location) {
            const user = getCurrentUser();
            if (user) {
                setUserId(user.id);
                setUserProperties({
                    role: user.role,
                    storeId: user.currentStoreId || 'none',
                    plan: user.subscriptionPlan || 'free', // Assuming 'free' as default or handle null
                });
            }
            logPageView(location.pathname + location.search);
        }
    }, [location]);
};

export default usePageTracking;
