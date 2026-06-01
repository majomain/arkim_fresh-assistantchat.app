'use client'

import { errorToast } from "@/components/ui/sonner";
import { useAsset } from "@/hooks/use-asset";
import { useChat } from "@/hooks/use-chat";
import { useLocation } from "@/hooks/use-location";
import workOrderService from "@/services/api/workOrderService";
import { WorkOrderDetail, WorkOrderDetailList, WorkOrderStatus } from "@/types/workOrder/workOrder";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Calendar, ClipboardListIcon, SearchIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WorkLogDialog from "../work-order/WorkLogDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useWorkOrderBroadcast } from "@/hooks/broadcasts/use-workorder-broadcast";

export default function WorkOrderSearch({ isTyping, search, closeDialog }: { isTyping: boolean; search: string; closeDialog: () => void; }) {
    // user context utils
    const { user } = useAuth();
    // asset utils
    const { getAssetFromListById, isAssetListLoading } = useAsset();
    // chat utlis
    const { postMessageAsync } = useChat();
    // location util
    const { selectedLocation } = useLocation();

    const [workOrders, setWorkOrders] = useState<WorkOrderDetailList>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // router to redirect
    const router = useRouter();

    // broadcasting setup
    const { claimWorkOrder, requestRefresh, removeWorkOrder, refreshWorkOrderList } = useWorkOrderBroadcast((event) => {
        if (event.type === 'WORK_ORDER_CLAIMED') removeWorkOrder(setWorkOrders, event.workOrderId, event.siteId);
        if (event.type === 'WORK_ORDER_LIST_REFRESH') refreshWorkOrderList(getWorkOrders, event.siteId);
    });


    // handle card click functionality
    const handleCardClick = (workOrder: WorkOrderDetail, descLengthLessThan: boolean = true) => {
        if ((!descLengthLessThan && workOrder.description.length > 80) || (descLengthLessThan && workOrder.description.length < 80)) {
            return;
        }

        if (workOrder.status === 'open') {
            claimWorkOrder(workOrder.id, selectedLocation?.id ?? '', 'thread_opened');
            postMessageAsync(
                '',
                workOrder.assetId,
                '',
                true,
                '',
                {
                    workOrderId: workOrder.id,
                    dueDate: workOrder.dueDate,
                    title: workOrder.title,
                },
                'assistant',
            );
        } else if (workOrder.status === 'thread_opened' && workOrder.threadOpenedBy === user?.email) {
            router.push(`/thread?id=${workOrder.threadId}`);
        }

        closeDialog();
    }

    function getStatusLabel(status: WorkOrderStatus) {
        switch (status) {
            case 'open': return 'Open';
            case 'cancelled': return 'Cancelled';
            case 'completed': return 'Completed';
            case 'thread_opened': return 'In Progress';
        }
    }

    // get list of pending work orders
    const getWorkOrders = useCallback(async () => {
        try {
            if (!search) {
                setWorkOrders([]);
                return;
            }

            if (selectedLocation) {
                setIsLoading(true);

                const dateObj = new Date();
                const response =
                    await workOrderService.getAssignedWorkOrders(
                        dateObj,
                        selectedLocation?.id ?? '',
                        null,
                        null,
                        search
                    );

                setWorkOrders(response);
            }
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [selectedLocation, search]);

    // Sort work orders by due date (most recent first)
    const sortedWorkOrders = useMemo(() => {
        return [...workOrders].sort((a, b) =>
            b.dueDate.localeCompare(a.dueDate),
        );
    }, [workOrders]);

    useEffect(() => {
        getWorkOrders();
    }, [getWorkOrders]);

    return isLoading || isAssetListLoading || isTyping ? (
        <div className="grid grid-cols-1 gap-2 max-h-[60dvh] overflow-y-auto px-2 scrollable">
            {
                Array.from({ length: 1 }).map((_, index) => (
                    <Skeleton key={index} className="h-35 w-full rounded-lg" />
                ))
            }
        </div>
    ) : sortedWorkOrders.length ? (
        <div className="grid grid-cols-1 gap-2 max-h-[60dvh] overflow-y-auto px-2 scrollable">
            {sortedWorkOrders.map((workOrder, index) => {
                const asset = getAssetFromListById(workOrder.assetId);

                return (
                    <Card
                        key={`workorder-${workOrder.id}-${index}`}
                        className={cn(
                            workOrder.status === 'thread_opened' && workOrder.threadOpenedBy !== user?.email ? '' : 'hover:shadow-none cursor-pointer'
                        )}
                        onClick={() => handleCardClick(workOrder, false)}
                    >
                        <CardContent className='flex flex-col gap-1.5 h-full'>
                            <div className='flex flex-row justify-between items-center mb-3'>
                                <p className="text-xs flex flex-row justify-start items-center gap-1 font-medium" onClick={() => handleCardClick(workOrder)}>
                                    <Calendar className='size-3' />  Due : <span>{workOrder.dueDate}</span>
                                </p>
                                <Badge variant='outline' className={`
                                border-none ${workOrder.status === "thread_opened" ? "bg-primary/15"
                                        : workOrder.status === 'completed' ? "bg-success/15"
                                            : workOrder.status === 'cancelled' ? 'bg-destructive/15'
                                                : 'bg-warning/15'}`}>
                                    <p className={`${workOrder.status === "thread_opened" ? "text-primary"
                                        : workOrder.status === 'completed' ? "text-success"
                                            : workOrder.status === 'cancelled' ? 'text-destructive' :
                                                'text-warning'}`}>
                                        {getStatusLabel(workOrder.status)}
                                    </p>
                                </Badge>
                            </div>
                            <div className='flex flex-col' onClick={() => handleCardClick(workOrder)}>
                                <div className="flex flex-col gap-1">
                                    <p className="text-base font-semibold line-clamp-1">
                                        {workOrder.title}
                                    </p>
                                    <p className={cn(
                                        "text-sm text-muted-foreground",
                                        workOrder.description.length > 80 && 'line-clamp-2'
                                    )}>
                                        {workOrder.description}
                                    </p>
                                </div>
                            </div>

                            <Dialog>
                                <DialogTrigger>
                                    <span className={cn(
                                        workOrder.description.length > 80 ? 'text-xs font-medium text-primary text-start block w-full' : 'hidden'
                                    )}>show more</span>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogDescription />
                                    <DialogTitle>Description</DialogTitle>
                                    <p className='text-sm text-muted-foreground'>{workOrder.description}</p>
                                </DialogContent>
                            </Dialog>

                            <div className='flex-1' />

                            <div className={cn('flex flex-col gap-1')} onClick={() => handleCardClick(workOrder)}>
                                <Separator />
                                <p className='mt-2 text-sm font-medium flex flex-row items-center gap-1'><Box className='size-4' />Asset Detail</p>
                                <div className="grid grid-cols-2 gap-1.5 pl-0.5">
                                    <p className="text-xs flex flex-col items-start font-medium text-muted-foreground">
                                        Name
                                        <span className="!font-normal">{asset?.name ?? '-'}</span>
                                    </p>
                                    <p className="text-xs flex flex-col items-start font-medium text-muted-foreground">
                                        Type
                                        <span className="!font-normal">{asset?.type ?? '-'}</span>
                                    </p>
                                    <p className="text-xs flex flex-col items-start font-medium text-muted-foreground">
                                        Manufacturer
                                        <span className="!font-normal">{asset?.manufacturer ?? '-'}</span>
                                    </p>
                                    <p className="text-xs flex flex-col items-start font-medium text-muted-foreground">
                                        Model
                                        <span className="!font-normal">{asset?.model ?? '-'}</span>
                                    </p>
                                </div>
                            </div>

                            {workOrder.status === 'thread_opened' && workOrder.threadOpenedBy !== user?.email ? (
                                <Badge variant='outline' className='mx-auto mt-3'>
                                    Other technican working
                                </Badge>
                            ) : workOrder.status === 'completed' ? (
                                <WorkLogDialog workOrder={workOrder}>
                                    <Button variant='secondary' className="w-full mt-3">
                                        Work Logs
                                    </Button>
                                </WorkLogDialog>
                            ) : null}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    ) : (
        <div className="w-full flex flex-col justify-center items-center mb-10">
            <div className="p-3 flex justify-center items-center bg-transparent cursor-default">
                {
                    search
                        ?
                        <ClipboardListIcon
                            className="w-16 h-16 text-muted-foreground"
                            strokeWidth={1}
                        />
                        :
                        <SearchIcon
                            className="w-16 h-16 text-muted-foreground"
                            strokeWidth={1}
                        />
                }
            </div>
            <div className="flex flex-col gap-2 items-center justify-center text-center">
                <h3 className="text-base font-semibold">
                    {
                        search ? 'No pending work orders found' : 'Start typing to search'
                    }
                </h3>
            </div>
        </div>
    )
}