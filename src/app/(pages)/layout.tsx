'use client'

import PageLoader from "@/components/core/PageLoader";
import Header from "@/components/layout/Header";
import SideBar from "@/components/layout/SideBar";
import { useAuth } from "@/hooks/use-auth";
import { ProgressProvider } from '@bprogress/next/app';
import { BProgress } from '@bprogress/core';
import { usePathname } from "next/navigation";
import { useEffect, useTransition } from "react";
import ResponseNotification from "@/components/core/chat/ResponseAlert";
import { requestNotificationPermission } from "@/utils/web-notification";
import { DraggableCardProvider } from "@/providers/DraggableCardProvider";
import OnboardFloatingCard from "@/components/core/floating-onboard/OnboardFloatingCard";
import { cn } from "@/lib/utils";
import { useCompanyBroadcast } from "@/hooks/broadcasts/use-company-broadcast";
import { DraftProvider } from "@/providers/DraftProvider";
import MobileTabBar from "@/components/layout/MobileTabBar";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
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
        BProgress.start()
        startTransition(() => {
            BProgress.done()
        })
    }, [pathname]);

    // check for push notification permission
    useEffect(() => {
        requestNotificationPermission();
    }, []);

    return loading
        ?
        <PageLoader />
        :
        <ProgressProvider
            height="4px"
            color="var(--primary)"
            options={{ showSpinner: false }}

        >
            {
                user
                    ?
                    <DraftProvider>
                        <DraggableCardProvider>
                            {
                                pathname.includes('help-and-faq') || pathname.includes('terms-and-policies')
                                    ?
                                    children
                                    :
                                    <>
                                        <SideBar />
                                        <div className="flex flex-col w-full">
                                            <Header />
                                            <div className={cn(
                                                !pathname.includes('/thread') && 'px-2.5',
                                                // clear the mobile bottom tab bar (hidden on thread)
                                                !pathname.includes('/thread') && 'pb-16 md:pb-0',
                                            )}>
                                                <ResponseNotification />

                                                <OnboardFloatingCard />
                                                {children}
                                            </div>

                                        </div>
                                        <MobileTabBar />
                                    </>
                            }
                        </DraggableCardProvider>
                    </DraftProvider>
                    :
                    children
            }
        </ProgressProvider>;
}