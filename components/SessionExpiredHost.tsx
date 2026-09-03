import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SESSION_EXPIRED_EVENT } from '../services/api';
import { logout } from '../services/authService';
import { useToast } from '../contexts/ToastContext';

/**
 * Ends the session cleanly when the server says the token is no longer good.
 *
 * The API layer already recognised a locked add-on (402) and offered an upgrade,
 * but a 401 fell through as an ordinary error — so an expired or revoked token
 * left the user on a working-looking screen where every button produced a
 * failure toast and nothing said to sign in again.
 *
 * Tokens last 30 days, so this is not an everyday event; it is what happens
 * after a password change, a revoked login, or a token that outlived a
 * redeploy — exactly the cases where a confusing dead screen is most alarming.
 */
const SessionExpiredHost: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    // A dead token usually fails several in-flight requests at once. Only the
    // first should sign the user out and say so.
    const handled = useRef(false);

    useEffect(() => {
        const onExpired = () => {
            if (handled.current) return;
            // Already on the way out — nothing to interrupt.
            if (location.pathname === '/login' || location.pathname === '/register') return;
            handled.current = true;

            logout();
            showToast('Your session has ended. Please sign in again.', 'warning');
            navigate('/login', { replace: true });

            // Let a genuinely new session expire later in the same tab.
            window.setTimeout(() => { handled.current = false; }, 5000);
        };

        window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    }, [navigate, location.pathname, showToast]);

    return null;
};

export default SessionExpiredHost;
