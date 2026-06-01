'use client';

import { ThreadAction } from '@/types/equipment/thread';
import { Archive, CircleCheck, ClipboardList } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

import { cn } from '@/lib/utils';

import CreateWorkOrderDialog from './CreateWorkOrderDialog';

export default function ActionPopover({
    threadTitle,
    threadId,
    action,
    children,
    onOpenChange,
    side,
    align,
    colored = false,
    hasAttachments = false,
    startedFromWorkOrder = false,
}: {
    threadTitle: string;
    threadId: string;
    action: (
        action: ThreadAction,
        threadTitle: string,
        threadId: string,
    ) => void;
    children: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    colored?: boolean;
    hasAttachments?: boolean;
    startedFromWorkOrder?: boolean;
}) {
    const [open, setOpen] = useState<boolean>(false);
    const [selectedAction, setSelectedAction] = useState<ThreadAction | null>(
        null,
    );
    const [workOrderDialogOpen, setWorkOrderDialogOpen] =
        useState<boolean>(false);

    const loadDialog = (action: ThreadAction) => {
        setSelectedAction(action);
        setOpen(true);
    };

    return (
        <>
            <Popover onOpenChange={onOpenChange}>
                <PopoverTrigger asChild>{children}</PopoverTrigger>
                <PopoverContent
                    side={side}
                    align={align ?? 'end'}
                    className="flex flex-col gap-1 justify-start w-42 py-2 px-0 rounded-md"
                >
                    <button
                        type="button"
                        className={cn(
                            'flex flex-row items-center gap-2 text-start w-full py-1.5 px-2 text-sm',
                            colored
                                ? 'text-success hover:bg-success/15'
                                : 'hover:bg-muted',
                        )}
                        onClick={() => loadDialog('report')}
                    >
                        <CircleCheck className="size-4" />
                        Report
                    </button>
                    <button
                        type="button"
                        className={cn(
                            'flex flex-row items-center gap-2 text-start w-full py-1.5 px-2 text-sm',
                            colored
                                ? 'text-destructive hover:bg-destructive/15'
                                : 'hover:bg-muted',
                        )}
                        onClick={() => loadDialog('close')}
                    >
                        <Archive className="size-4" />
                        Close
                    </button>
                    {!startedFromWorkOrder && (
                        <button
                            type="button"
                            className={cn(
                                'flex flex-row items-center gap-2 text-start w-full py-1.5 px-2 text-sm',
                                'hover:bg-muted',
                            )}
                            onClick={() => setWorkOrderDialogOpen(true)}
                        >
                            <ClipboardList className="size-4" />
                            Create Work Order
                        </button>
                    )}
                </PopoverContent>
            </Popover>

            <Dialog open={open} onOpenChange={() => setOpen(!open)}>
                <DialogTrigger />
                <DialogContent className="w-sm" hideCloseButton>
                    <DialogHeader>
                        <DialogTitle className="text-start">
                            Confirmation Required
                        </DialogTitle>
                        <DialogDescription />
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Are you sure, you want to {selectedAction}{' '}
                        <b>{threadTitle}</b>?
                    </p>
                    <div className="w-full flex flex-row items-center gap-5 mt-4">
                        <Button
                            className="flex-1"
                            onClick={() => {
                                setOpen(false);
                                if (selectedAction) {
                                    action(
                                        selectedAction,
                                        threadTitle,
                                        threadId,
                                    );
                                }
                            }}
                        >
                            Confirm
                        </Button>
                        <Button
                            className="flex-1"
                            variant="secondary"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <CreateWorkOrderDialog
                open={workOrderDialogOpen}
                onOpenChange={setWorkOrderDialogOpen}
                threadId={threadId}
                threadTitle={threadTitle}
                hasAttachments={hasAttachments}
                onSuccess={() => {
                    action('close', threadTitle, threadId);
                }}
            />
        </>
    );
}
