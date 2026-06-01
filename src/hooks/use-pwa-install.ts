'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export function usePWAInstall() {
    const [installPrompt, setInstallPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        const checkInstalled = () => {
            if (typeof window !== 'undefined') {
                const isStandalone = window.matchMedia(
                    '(display-mode: standalone)',
                ).matches;
                const isIOSStandalone =
                    (window.navigator as any).standalone === true;
                setIsInstalled(isStandalone || isIOSStandalone);
            }
        };

        checkInstalled();

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setInstallPrompt(null);
            setIsInstallable(false);
            setIsInstalled(true);
        };

        window.addEventListener(
            'beforeinstallprompt',
            handleBeforeInstallPrompt,
        );
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener(
                'beforeinstallprompt',
                handleBeforeInstallPrompt,
            );
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const install = async () => {
        if (!installPrompt) return false;

        try {
            await installPrompt.prompt();
            const choiceResult = await installPrompt.userChoice;

            if (choiceResult.outcome === 'accepted') {
                setInstallPrompt(null);
                setIsInstallable(false);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Installation failed:', error);
            return false;
        }
    };

    return {
        isInstallable: isInstallable && !isInstalled,
        isInstalled,
        install,
        canInstall: installPrompt !== null,
    };
}
