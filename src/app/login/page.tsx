'use client';

import { STORAGE_KEYS } from '@/config/constant';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import oidcAuthService from '@/services/auth/oidcAuthService';

export default function LoginPage() {
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(true);

    useEffect(() => {
        const initiateLogin = async () => {
            if (oidcAuthService.isSigningOut()) {
                oidcAuthService.clearSignOutFlag();
                setIsRedirecting(false);
                return;
            }

            // Check if already authenticated
            if (oidcAuthService.isAuthenticated()) {
                console.log(
                    'Already authenticated, checking company selection...',
                );

                // Check if company is selected
                const selectedCompanyId = localStorage.getItem(
                    STORAGE_KEYS.SELECTED_COMPANY_ID,
                );
                if (selectedCompanyId) {
                    console.log(
                        'Company already selected, redirecting to home...',
                    );
                    window.location.href = '/';
                } else {
                    console.log(
                        'No company selected, redirecting to company selection...',
                    );
                    window.location.href = '/company-select';
                }
                return;
            }

            try {
                console.log('Initiating Cognito sign in...');
                // Redirect to Cognito hosted UI
                await oidcAuthService.signIn('/');
            } catch (error) {
                console.error('Failed to initiate sign in:', error);
                setIsRedirecting(false);
            }
        };

        initiateLogin();
    }, [router]);

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-background z-50">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner className="w-10 h-10" />
                <p className="text-sm text-muted-foreground text-center">
                    {isRedirecting
                        ? 'Redirecting to sign in...'
                        : 'Failed to redirect. Please refresh the page.'}
                </p>
            </div>
        </div>
    );
}
