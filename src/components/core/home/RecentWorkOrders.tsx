'use client';

import { useThreadBroadcast } from '@/hooks/broadcasts/use-thread-broadcast';
import { useAsset } from '@/hooks/use-asset';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from '@/hooks/use-location';
import workOrderService from '@/services/api/workOrderService';
import {
    WorkOrderDetailList,
    WorkOrderStatus,
} from '@/types/workOrder/workOrder';
import { ChevronLeft, ChevronRight, ClipboardListIcon } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { errorToast } from '@/components/ui/sonner';

import { cn } from '@/lib/utils';

import WorkOrdersSkeleton from '@/app/(pages)/work-orders/WorkOrdersSkeleton';

import DisplayCard from '../work-order/DisplayCard';

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

export default function RecentWorkOrders() {
    const { user } = useAuth();
    const { isAssetListLoading } = useAsset();
    const { selectedLocation, isLoadingLocations } = useLocation();
    const [recentWorkOrders, setRecentWorkOrders] =
        useState<WorkOrderDetailList>([]);
    const [loadingRecentWorkOrders, setLoadingRecentWorkOrders] =
        useState<boolean>(true);
    const [page, setPage] = useState(0);
    const visibleSlides = useVisibleSlides();

    // broadcast setup
    const broadcast = useThreadBroadcast((event) => {
        if (event.type === 'THREAD_STATUS_UPDATED') {
            setRecentWorkOrders((prev) =>
                prev.filter(
                    (workOrder) => workOrder.threadId !== event.threadId,
                ),
            );
        }
    });

    function getStatusLabel(status: WorkOrderStatus) {
        switch (status) {
            case 'open':
                return 'Open';
            case 'cancelled':
                return 'Cancelled';
            case 'completed':
                return 'Completed';
            case 'thread_opened':
                return 'In Progress';
        }
    }

    async function getRecentWorkOrders() {
        try {
            setLoadingRecentWorkOrders(true);
            const data = await workOrderService.getAssignedWorkOrders(
                null,
                selectedLocation?.id,
                null,
            );
            setRecentWorkOrders(data);
        } catch (error: any) {
            errorToast({
                title: 'Recent work order fetch error',
                description: error.message,
            });
        } finally {
            setLoadingRecentWorkOrders(false);
        }
    }

    const allItems = useMemo(
        () =>
            recentWorkOrders
                .filter(
                    (workOrder) =>
                        (workOrder.threadOpenedBy === user?.email ||
                            workOrder.threadOpenedBy === null) &&
                        workOrder.status !== 'completed' &&
                        workOrder.status !== 'cancelled',
                )
                .slice(0, 15),
        [recentWorkOrders],
    );

    // Reset to first page when viewport or data changes
    useEffect(() => {
        setPage(0);
    }, [visibleSlides, allItems.length]);

    useEffect(() => {
        if (isLoadingLocations) return;
        if (selectedLocation) {
            getRecentWorkOrders();
        } else {
            setRecentWorkOrders([]);
            setLoadingRecentWorkOrders(false);
        }
    }, [isLoadingLocations, selectedLocation]);

    const totalPages = Math.ceil(allItems.length / visibleSlides);
    const visibleItems = allItems.slice(
        page * visibleSlides,
        page * visibleSlides + visibleSlides,
    );

    return (
        <>
            <div className="flex items-center justify-between">
                <p className="type-section font-semibold">Recent Work Orders</p>

                <div className="flex flex-row gap-5 items-center">
                    {!loadingRecentWorkOrders &&
                        !isAssetListLoading &&
                        totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage((p) => p - 1)}
                                    disabled={page === 0}
                                    className={cn(
                                        'p-1.5 rounded-md border transition-none interactive-hover',
                                        page > 0
                                            ? 'border-border text-foreground'
                                            : 'opacity-40 cursor-not-allowed border-border/40 text-muted-foreground',
                                    )}
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page >= totalPages - 1}
                                    className={cn(
                                        'p-1.5 rounded-md border transition-none interactive-hover',
                                        page < totalPages - 1
                                            ? 'border-border text-foreground'
                                            : 'opacity-40 cursor-not-allowed border-border/40 text-muted-foreground',
                                    )}
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            </div>
                        )}

                    {recentWorkOrders.length > 15 ? (
                        <Link
                            href="/work-orders?status=thread_opened"
                            className="text-link font-semibold text-sm"
                        >
                            View All
                        </Link>
                    ) : null}
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollable">
                {loadingRecentWorkOrders || isAssetListLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5 content-start">
                        <WorkOrdersSkeleton count={visibleSlides} />
                    </div>
                ) : visibleItems.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5 content-start">
                        {visibleItems.map((workOrder, index) => {
                            return (
                                <DisplayCard
                                    key={`workorder-${workOrder.id}-${index}`}
                                    workOrder={workOrder}
                                    getStatusLabel={getStatusLabel}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="w-full flex flex-col justify-center items-center">
                        <ClipboardListIcon
                            className="size-15 text-muted-foreground"
                            strokeWidth={1}
                        />
                        <div className="flex flex-col gap-1 items-center justify-center text-center">
                            <p className="text-base font-semibold">
                                No recent work orders found
                            </p>
                            <span className="text-sm text-muted-foreground">
                                Start working on the pending work orders
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
