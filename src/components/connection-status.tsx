'use client';

import { useNetworkStatus } from '@/hooks/use-network-status';
import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';

export function ConnectionStatus() {
    const { isOnline, isOffline } = useNetworkStatus();
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);

    useEffect(() => {
        if (isOffline) {
            setShowOfflineMessage(true);
        } else {
            // Hide the message after a brief delay when back online
            const timer = setTimeout(() => {
                setShowOfflineMessage(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isOffline]);

    if (!showOfflineMessage) {
        return null;
    }

    return (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 transform">
            <Badge
                variant={isOffline ? 'destructive' : 'default'}
                className="flex items-center gap-2 px-3 py-1"
            >
                {isOffline ? (
                    <>
                        <WifiOff className="h-3 w-3" />
                        <span className="text-xs">No internet connection</span>
                    </>
                ) : (
                    <>
                        <Wifi className="h-3 w-3" />
                        <span className="text-xs">Connection restored</span>
                    </>
                )}
            </Badge>
        </div>
    );
}

export function OfflineFallback() {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
                No Internet Connection
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
                The AI assistant requires an internet connection to function.
                Please check your network and try again.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="text-sm text-primary hover:underline"
            >
                Retry
            </button>
        </div>
    );
}
