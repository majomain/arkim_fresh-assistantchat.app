'use client';

import { useCompanyBroadcast } from '@/hooks/broadcasts/use-company-broadcast';
import { useAuth } from '@/hooks/use-auth';
import { DraftProvider } from '@/providers/DraftProvider';
import { DraggableCardProvider } from '@/providers/DraggableCardProvider';
import { BProgress } from '@bprogress/core';
import { ProgressProvider } from '@bprogress/next/app';
import { usePathname } from 'next/navigation';
import { useEffect, useTransition } from 'react';

import PageLoader from '@/components/core/PageLoader';
import ResponseNotification from '@/components/core/chat/ResponseAlert';
import OnboardFloatingCard from '@/components/core/floating-onboard/OnboardFloatingCard';
import Header from '@/components/layout/Header';
import MobileTabBar from '@/components/layout/MobileTabBar';
import SideBar from '@/components/layout/SideBar';

import { requestNotificationPermission } from '@/utils/web-notification';

import { cn } from '@/lib/utils';

/** Main list pages embed title + nav in PageTopBar instead of the global Header. */
function usesPageTopBar(pathname: string): boolean {
    if (pathname === '/') return true;
    return [
        '/work-orders',
        '/open-threads',
        '/assets',
        '/analytics',
        '/drafts',
    ].some((p) => pathname.startsWith(p));
}

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // user data and loading status for user api
    const { user, loading, refreshSession } = useAuth();
    // current path name
    const pathname = usePathname();
    // transition for progress loader
    const [isPending, startTransition] = useTransition();

    // broadcast setup
    const { companyUpdated } = useCompanyBroadcast((event) => {
        if (event.type === 'COMPANY_UPDATED') {
            refreshSession();
        }
    });

    // show progress loader whenever page changes
    useEffect(() => {
        BProgress.start();
        startTransition(() => {
            BProgress.done();
        });
    }, [pathname]);

    // check for push notification permission
    useEffect(() => {
        requestNotificationPermission();
    }, []);

    return loading ? (
        <PageLoader />
    ) : (
        <ProgressProvider
            height="4px"
            color="var(--primary)"
            options={{ showSpinner: false }}
        >
            {user ? (
                <DraftProvider>
                    <DraggableCardProvider>
                        {pathname.includes('help-and-faq') ||
                        pathname.includes('terms-and-policies') ? (
                            children
                        ) : (
                            <>
                                <SideBar />
                                <div className="flex flex-col w-full">
                                    {!usesPageTopBar(pathname) && <Header />}
                                    <div
                                        className={cn(
                                            !pathname.includes('/thread') &&
                                                'px-2.5',
                                            // clear the mobile bottom tab bar (hidden on thread)
                                            !pathname.includes('/thread') &&
                                                'pb-16 md:pb-0',
                                        )}
                                    >
                                        <ResponseNotification />

                                        <OnboardFloatingCard />
                                        {children}
                                    </div>
                                </div>
                                <MobileTabBar />
                            </>
                        )}
                    </DraggableCardProvider>
                </DraftProvider>
            ) : (
                children
            )}
        </ProgressProvider>
    );
}
