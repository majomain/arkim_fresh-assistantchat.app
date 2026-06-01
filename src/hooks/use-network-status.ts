'use client';

import { useEffect, useState } from 'react';

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [connectionType, setConnectionType] = useState<string>('unknown');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Initialize state
        setIsOnline(navigator.onLine);

        // Get connection info if available
        const connection =
            (navigator as any).connection ||
            (navigator as any).mozConnection ||
            (navigator as any).webkitConnection;
        if (connection) {
            setConnectionType(
                connection.effectiveType || connection.type || 'unknown',
            );
        }

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        const handleConnectionChange = () => {
            if (connection) {
                setConnectionType(
                    connection.effectiveType || connection.type || 'unknown',
                );
            }
        };

        // Add event listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (connection) {
            connection.addEventListener('change', handleConnectionChange);
        }

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);

            if (connection) {
                connection.removeEventListener(
                    'change',
                    handleConnectionChange,
                );
            }
        };
    }, []);

    return {
        isOnline,
        isOffline: !isOnline,
        connectionType,
    };
}
