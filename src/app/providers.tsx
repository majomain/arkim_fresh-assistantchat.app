'use client';

import AuthProvider from '@/providers/AuthProvider';
import ChatProvider from '@/providers/ChatProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, Suspense } from 'react';
import { ConnectionStatus } from '@/components/connection-status';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import LocationProvider from '@/providers/LocationProvider';
import AssetProvider from '@/providers/AssetProvider';
import ThreadProvider from '@/providers/ThreadProvider';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
        },
    },
});

export const Providers = ({ children }: { children: ReactNode }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <Suspense>
                    <SidebarProvider>
                        <AuthProvider>
                            <LocationProvider>
                                <AssetProvider>
                                    <ThreadProvider>
                                        <ChatProvider>
                                            {children}
                                        </ChatProvider>
                                    </ThreadProvider>
                                </AssetProvider>
                            </LocationProvider>
                        </AuthProvider>
                        <Toaster />
                        <PWAInstallPrompt />
                        <ConnectionStatus />
                    </SidebarProvider>
                </Suspense>
            </NextThemesProvider>
        </QueryClientProvider>
    );
};
