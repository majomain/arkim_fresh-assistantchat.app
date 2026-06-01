'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import oidcAuthService from '@/services/auth/oidcAuthService';

export default function SignInOidcCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                setIsProcessing(true);
                console.log('Starting OIDC callback processing...');
                console.log('Current URL:', window.location.href);

                // Check if we have the required parameters
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const errorParam = urlParams.get('error');

                console.log('URL params:', {
                    code,
                    error: errorParam,
                    state: urlParams.get('state'),
                });

                if (errorParam) {
                    throw new Error(`Authentication failed: ${errorParam}`);
                }

                if (!code) {
                    throw new Error(
                        'No authorization code received from Cognito',
                    );
                }

                await oidcAuthService.signInCallback();
                console.log(
                    'Callback successful, redirecting to company selection',
                );

                router.replace('/company-select');
            } catch (error) {
                console.error('OIDC callback error:', error);
                console.error('Error details:', {
                    name: error instanceof Error ? error.name : 'Unknown',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                });
                setError(
                    error instanceof Error
                        ? `${error.name}: ${error.message}`
                        : 'An error occurred during authentication. Please try again.',
                );
            } finally {
                setIsProcessing(false);
            }
        };

        handleCallback();
    }, [router]);

    if (isProcessing) {
        return (
            <div className="fixed inset-0 flex items-center justify-center p-4 bg-background z-50">
                <div className="flex flex-col items-center gap-4">
                    <LoadingSpinner className="w-10 h-10" />
                    <p className="text-sm text-muted-foreground text-center">
                        Completing sign in...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 flex items-center justify-center p-4 bg-background z-50">
                <AlertDialog open={true}>
                    <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-center">
                                Authentication Error
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-center">
                                {error}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <Button
                                onClick={() => router.replace('/login')}
                                className="w-full"
                            >
                                Try Again
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    return null;
}
