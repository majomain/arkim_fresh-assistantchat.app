import { useEffect, useState } from 'react';

export function useVersion() {
    const [version, setVersion] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const response = await fetch('/version.txt');
                if (response.ok) {
                    const versionText = await response.text();
                    setVersion(versionText.trim());
                }
            } catch (error) {
                console.warn('Failed to load version:', error);
                setVersion('Unknown');
            } finally {
                setIsLoading(false);
            }
        };

        fetchVersion();
    }, []);

    return { version, isLoading };
}
