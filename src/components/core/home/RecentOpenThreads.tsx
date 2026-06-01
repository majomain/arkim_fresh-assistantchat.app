'use client'

import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useEffect, useMemo, useState, useCallback } from "react";
import { WorkOrderDetail, WorkOrderDetailList } from "@/types/workOrder/workOrder";
import workOrderService from "@/services/api/workOrderService";
import { useLocation } from "@/hooks/use-location";
import { errorToast } from "@/components/ui/sonner";
import { useAsset } from "@/hooks/use-asset";
import { Card, CardContent } from "@/components/ui/card";
import { Box, Calendar, ChevronLeft, ChevronRight, ClipboardListIcon, MessageSquare, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { ThreadDetailList } from "@/types/equipment/thread";
import messagingService from "@/services/api/messagingService";
import OpenThreadsSkeleton from "@/app/(pages)/open-threads/OpenThreadsSkeleton";
import { useThreadBroadcast } from "@/hooks/broadcasts/use-thread-broadcast";

const SLIDES_PER_VIEW = { default: 2, sm: 4, md: 4, lg: 6, '2xl': 8 } as const;

function useVisibleSlides() {
    const get = useCallback(() => {
        if (typeof window === 'undefined') return SLIDES_PER_VIEW.default;
        const w = window.innerWidth;
        if (w >= 1536) return SLIDES_PER_VIEW['2xl'];
        if (w >= 1024) return SLIDES_PER_VIEW.lg;
        if (w >= 768) return SLIDES_PER_VIEW.md;
        if (w >= 640) return SLIDES_PER_VIEW.sm;
        return SLIDES_PER_VIEW.default;
    }, []);

    const [slides, setSlides] = useState(get);

    useEffect(() => {
        const ro = new ResizeObserver(() => setSlides(get()));
        ro.observe(document.body);
        return () => ro.disconnect();
    }, [get]);

    return slides;
}

export default function RecentOpenThreads() {
    const { isAssetListLoading, getAssetFromListById } = useAsset();
    const { selectedLocation, isLoadingLocations } = useLocation();
    const [recentOpenThreads, setRecentopenThreads] = useState<ThreadDetailList>([]);
    const [loadingRecentOpenThreads, setLoadingRecentOpenThreads] = useState<boolean>(true);
    const [page, setPage] = useState(0);
    const router = useRouter();
    const visibleSlides = useVisibleSlides();

    // broadcast setup
    const broadcast = useThreadBroadcast((event) => {
        if (event.type === 'THREAD_STATUS_UPDATED') {
            setRecentopenThreads((prev) => prev.filter((thread) => thread.threadId !== event.threadId));
        }
    });

    async function getRecentOpenThreads() {
        try {
            setLoadingRecentOpenThreads(true);
            const data = await messagingService.getOpenThreads(selectedLocation?.id ?? '');
            setRecentopenThreads(data);
        } catch (error: any) {
            errorToast({ title: 'Recent open thread fetch error', description: error.message });
        } finally {
            setLoadingRecentOpenThreads(false);
        }
    }

    const allItems = useMemo(() => recentOpenThreads.filter((openThread) => !openThread.workOrderId).slice(0, 15), [recentOpenThreads]);

    // Reset to first page when viewport or data changes
    useEffect(() => { setPage(0); }, [visibleSlides, allItems.length]);

    useEffect(() => {
        if (!isLoadingLocations && selectedLocation) getRecentOpenThreads();
    }, [isLoadingLocations, selectedLocation]);

    const totalPages = Math.ceil(allItems.length / visibleSlides);
    const visibleItems = allItems.slice(page * visibleSlides, page * visibleSlides + visibleSlides);

    return <>
        <div className="flex items-center justify-between mt-10" >
            <p className="text-xl font-semibold">Recent Open threads</p>

            <div className="flex flex-row gap-5 items-center">
                {!loadingRecentOpenThreads && !isAssetListLoading && totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => p - 1)}
                            disabled={page === 0}
                            className={cn(
                                "p-1.5 rounded-md border transition-colors",
                                page > 0
                                    ? "hover:bg-accent border-border text-foreground"
                                    : "opacity-40 cursor-not-allowed border-border/40 text-muted-foreground"
                            )}
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= totalPages - 1}
                            className={cn(
                                "p-1.5 rounded-md border transition-colors",
                                page < totalPages - 1
                                    ? "hover:bg-accent border-border text-foreground"
                                    : "opacity-40 cursor-not-allowed border-border/40 text-muted-foreground"
                            )}
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                )}

                {
                    recentOpenThreads.length > 15
                        ?
                        <Link href='/open-threads' className="text-link font-semibold text-sm">View All</Link>
                        :
                        null
                }
            </div>
        </div >
        < div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollable" >
            {loadingRecentOpenThreads || isAssetListLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5 content-start">
                    <OpenThreadsSkeleton count={visibleSlides} />
                </div>
            ) : visibleItems.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5 content-start">
                    {visibleItems.map((thread, index) => {
                        const asset = getAssetFromListById(thread.assetId);
                        return <Card key={thread.threadId} className="cursor-pointer hover:shadow-none" onClick={() => router.push(`/thread/?id=${thread.threadId}`)}>
                            <CardContent className='flex flex-col gap-1.5 h-full'>
                                <p className="text-base font-semibold">{thread.workOrderTitle ?? thread.title}</p>

                                <div className="flex-1" />

                                <div className={cn(
                                    'flex flex-col gap-1',
                                )}>
                                    <Separator />

                                    <p className='mt-2 text-sm font-medium flex flex-row items-center gap-1'><Box className='size-4' />Asset Detail</p>

                                    <div className="grid grid-cols-2 gap-1.5 pl-0.5">
                                        <p className="text-xs flex flex-col items-start font-medium text-muted-foreground">
                                            Name
                                            <span className="!font-normal">
                                                {asset?.name ?? '-'}
                                            </span>
                                        </p>
                                        <p className="text-xs flex flex-col items-start font-medium text-muted-foreground">
                                            Type
                                            <span className="!font-normal">
                                                {asset?.type ?? '-'}
                                            </span>
                                        </p>
                                        <p className="text-xs flex flex-col items-start font-medium text-muted-foreground">
                                            Manufacturer
                                            <span className="!font-normal">
                                                {asset?.manufacturer ?? '-'}
                                            </span>
                                        </p>
                                        <p className="text-xs flex flex-col items-start font-medium text-muted-foreground">
                                            Model
                                            <span className="!font-normal">
                                                {asset?.model ?? '-'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    })}
                </div>
            ) : (
                <div className="w-full flex flex-col justify-center items-center">
                    <MessageSquare className="size-15 text-muted-foreground" strokeWidth={1} />
                    <div className="flex flex-col gap-1 items-center justify-center text-center">
                        <p className="text-base font-semibold">No recent open thread found</p>
                        <span className="text-sm text-muted-foreground">Start working on the pending work orders or start a new conversation</span>
                    </div>
                </div>
            )
            }
        </div >
    </>
}