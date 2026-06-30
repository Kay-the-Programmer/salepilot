import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import LogoutConfirmationModal from '../components/LogoutConfirmationModal';

interface LogoutModalContextValue {
    /**
     * Open the logout confirmation modal. Pass the action to run when the user
     * confirms — it fires once on confirm. Because the modal is mounted by this
     * provider (a parent of every Dashboard branch), logout works from anywhere,
     * including the standalone app shells that `return` before Dashboard's own
     * layout (POS, CRM, Inventory, …).
     */
    requestLogout: (onConfirm: () => void) => void;
}

const LogoutModalContext = createContext<LogoutModalContextValue | null>(null);

export const LogoutModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const confirmRef = useRef<(() => void) | null>(null);

    const requestLogout = useCallback((onConfirm: () => void) => {
        confirmRef.current = onConfirm;
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        confirmRef.current = null;
        setIsOpen(false);
    }, []);

    const confirm = useCallback(() => {
        const fn = confirmRef.current;
        confirmRef.current = null;
        setIsOpen(false);
        fn?.();
    }, []);

    return (
        <LogoutModalContext.Provider value={{ requestLogout }}>
            {children}
            <LogoutConfirmationModal isOpen={isOpen} onClose={close} onConfirm={confirm} />
        </LogoutModalContext.Provider>
    );
};

export const useLogoutModal = (): LogoutModalContextValue => {
    const ctx = useContext(LogoutModalContext);
    if (!ctx) throw new Error('useLogoutModal must be used within a LogoutModalProvider');
    return ctx;
};
