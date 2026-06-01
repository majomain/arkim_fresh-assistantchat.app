'use client';

import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export function PWAInstallPrompt() {
    const { isInstallable, install, canInstall } = usePWAInstall();
    const [isDismissed, setIsDismissed] = useState(false);

    // Check if user previously dismissed the prompt
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (dismissed) {
                setIsDismissed(true);
            }
        }
    }, []);

    if (!isInstallable || !canInstall || isDismissed) {
        return null;
    }

    const handleInstall = async () => {
        const success = await install();
        if (success) {
            setIsDismissed(true);
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        // Store dismissal in localStorage to remember user preference
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    return (
        <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md md:left-auto md:right-4 md:mx-0">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-2">
                        <Download className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-sm">
                            Install Arkim
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Get the native app experience
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex gap-2">
                    <Button
                        onClick={handleInstall}
                        size="sm"
                        className="flex-1"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Install
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDismiss}>
                        Later
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
