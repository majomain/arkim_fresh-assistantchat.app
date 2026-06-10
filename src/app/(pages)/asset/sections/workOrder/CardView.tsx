'use client';

import { useAuth } from '@/hooks/use-auth';
import {
    WorkOrderDetail,
    WorkOrderDetailList,
    WorkOrderStatus,
} from '@/types/workOrder/workOrder';
import { Calendar1, ClipboardList, Image, Logs } from 'lucide-react';
import { useRouter } from 'next/navigation';

import CardWithPagination from '@/components/core/CardWithPagination';
import AttachmentsDialog from '@/components/core/work-order/AttachmentsDialog';
import WorkLogDialog from '@/components/core/work-order/WorkLogDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

import { cn } from '@/lib/utils';

export default function CardView({
    filterWorkOrderList,
    getStatusLabel,
    getDateFromTimestamp,
    isDataLoading,
    createThreadFromWorkOrder,
}: {
    filterWorkOrderList: WorkOrderDetailList;
    getStatusLabel: (status: WorkOrderStatus) => string;
    getDateFromTimestamp: (timestamp: string) => string;
    isDataLoading: boolean;
    createThreadFromWorkOrder: (workOrder: WorkOrderDetail) => void;
}) {
    // user util
    const { user } = useAuth();

    // router to redirect
    const router = useRouter();

    function handleCardClick(workOrder: WorkOrderDetail) {
        if (
            workOrder.threadId &&
            workOrder.threadOpenedBy === user?.email &&
            workOrder.status !== 'open'
        ) {
            router.push(`thread?id=${workOrder.threadId}`);
            return;
        }

        createThreadFromWorkOrder(workOrder);
    }

    return (
        <div className="md:hidden">
            <CardWithPagination
                isDataLoading={isDataLoading}
                data={filterWorkOrderList}
                renderCard={(workOrder) => (
                    <div
                        key={workOrder.id}
                        className="w-full flex flex-col border rounded-md cursor-pointer"
                    >
                        <div
                            className="w-full pt-2 px-2 flex flex-row justify-between items-center"
                            onClick={() => handleCardClick(workOrder)}
                        >
                            <p className="flex flex-row items-center gap-1 text-sm font-semibold">
                                <Calendar1 className="size-4" />
                                Due :{workOrder.dueDate}
                            </p>
                            <Badge
                                variant="outline"
                                className={`
                                border-none ${
                                    workOrder.status === 'thread_opened'
                                        ? 'bg-primary/15'
                                        : workOrder.status === 'completed'
                                          ? 'bg-success/15'
                                          : workOrder.status === 'cancelled'
                                            ? 'bg-destructive/15'
                                            : 'bg-warning/15'
                                }`}
                            >
                                <p
                                    className={`${
                                        workOrder.status === 'thread_opened'
                                            ? 'text-primary'
                                            : workOrder.status === 'completed'
                                              ? 'text-success'
                                              : workOrder.status === 'cancelled'
                                                ? 'text-destructive'
                                                : 'text-warning'
                                    }`}
                                >
                                    {getStatusLabel(workOrder.status)}
                                </p>
                            </Badge>
                        </div>

                        <div className="flex flex-col gap-2 py-5 px-2">
                            <p
                                className={cn(
                                    'text-sm font-medium',
                                    ((workOrder.threadId &&
                                        workOrder.threadOpenedBy ===
                                            user?.email &&
                                        workOrder.status === 'thread_opened') ||
                                        (workOrder.status === 'open' &&
                                            !workOrder.threadId)) &&
                                        'text-link',
                                )}
                                onClick={() => handleCardClick(workOrder)}
                            >
                                {workOrder.title}
                            </p>

                            <div>
                                <p
                                    className={cn(
                                        'text-sm text-muted-foreground text-start whitespace-pre-wrap',
                                        workOrder.description.length > 100 &&
                                            'line-clamp-3',
                                    )}
                                    onClick={() => handleCardClick(workOrder)}
                                >
                                    {workOrder.description}
                                </p>
                                {workOrder.description.length > 100 ? (
                                    <Dialog>
                                        <DialogTrigger
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span
                                                className={cn(
                                                    workOrder.description
                                                        .length > 100
                                                        ? 'text-xs font-medium text-end text-link'
                                                        : 'hidden',
                                                )}
                                            >
                                                show more
                                            </span>
                                        </DialogTrigger>
                                        <DialogContent
                                            onClick={(e) => e.stopPropagation()}
                                            onInteractOutside={(e) =>
                                                e.preventDefault()
                                            }
                                        >
                                            <DialogDescription />
                                            <DialogTitle>
                                                Description
                                            </DialogTitle>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {workOrder.description}
                                            </p>
                                        </DialogContent>
                                    </Dialog>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-2 pb-2 px-2 w-full">
                            {workOrder.attachments &&
                                workOrder.attachments.length && (
                                    <AttachmentsDialog
                                        workOrder={workOrder}
                                        fullWidth={true}
                                    >
                                        <Button
                                            variant="secondary"
                                            className="w-full"
                                        >
                                            <Image
                                                className="size-3.5"
                                                strokeWidth={2}
                                            />
                                            Attachments
                                        </Button>
                                    </AttachmentsDialog>
                                )}
                            {workOrder.workLogs &&
                                workOrder.workLogs.length && (
                                    <WorkLogDialog workOrder={workOrder}>
                                        <Button
                                            variant="secondary"
                                            className="w-full"
                                        >
                                            <Logs
                                                className="size-3.5"
                                                strokeWidth={2}
                                            />
                                            Work Logs
                                        </Button>
                                    </WorkLogDialog>
                                )}
                        </div>

                        {workOrder.status === 'thread_opened' &&
                        workOrder.threadOpenedBy !== user?.email ? (
                            <Badge
                                variant="secondary"
                                className="mb-3 mx-auto"
                                onClick={() => handleCardClick(workOrder)}
                            >
                                Other technican working
                            </Badge>
                        ) : null}
                    </div>
                )}
                emptyState={
                    <div className="w-full flex flex-col items-center p-5 mt-5 gap-4">
                        <ClipboardList
                            className="text-muted-foreground w-15 h-15"
                            strokeWidth={1}
                        />
                        <div className="flex flex-col items-center">
                            <p className="text-base font-semibold">
                                No Work Order Found
                            </p>
                            <p className="text-sm text-muted-foreground text-center">
                                Works Orders assigned to you will show here
                            </p>
                        </div>
                    </div>
                }
            />
        </div>
    );
}
