'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useWorkOrderBroadcast } from '@/hooks/broadcasts/use-workorder-broadcast';
import { useAuth } from '@/hooks/use-auth';
import { useAsset } from '@/hooks/use-asset';
import { useChat } from '@/hooks/use-chat';
import { useLocation } from '@/hooks/use-location';
import { cn } from '@/lib/utils';
import { WorkOrderDetail, WorkOrderStatus } from '@/types/workOrder/workOrder';
import { AlertTriangle, ArrowRight, Box, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AttachmentsDialog from './AttachmentsDialog';
import WorkLogDialog from './WorkLogDialog';

// ── Due-date helpers ────────────────────────────────────────────────────────

function getDayDiff(dueDateStr: string): number | null {
    if (!dueDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const raw = dueDateStr.includes('T') ? dueDateStr : `${dueDateStr}T00:00:00`;
    const due = new Date(raw);
    if (isNaN(due.getTime())) return null;
    return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function formatDueLabel(diff: number | null, dueDateStr: string): string {
    if (diff === null) return dueDateStr ?? '';
    if (diff < -1) return `${Math.abs(diff)} days overdue`;
    if (diff === -1) return '1 day overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    if (diff < 7) return `Due in ${diff} days`;
    const raw = dueDateStr.includes('T') ? dueDateStr : `${dueDateStr}T00:00:00`;
    return (
        'Due ' +
        new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
}

// ── Status helpers ──────────────────────────────────────────────────────────

function resolveStatus(status: WorkOrderStatus, diff: number | null) {
    const overdue = status === 'open' && diff !== null && diff < 0;
    return { overdue };
}

function statusColor(status: WorkOrderStatus, overdue: boolean): string {
    if (overdue) return 'var(--st-overdue)';
    switch (status) {
        case 'open':          return 'var(--st-open)';
        case 'thread_opened': return 'var(--st-progress)';
        case 'completed':     return 'var(--st-done)';
        case 'cancelled':     return 'var(--st-cancel)';
        default:              return 'var(--muted-foreground)';
    }
}

function statusLabel(status: WorkOrderStatus, overdue: boolean, getLabel?: (s: WorkOrderStatus) => string): string {
    if (overdue) return 'Overdue';
    return getLabel?.(status) ?? status;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function DisplayCard({
    workOrder,
    getStatusLabel,
}: {
    workOrder: WorkOrderDetail;
    getStatusLabel?: (status: WorkOrderStatus) => string;
}) {
    const { user } = useAuth();
    const { postMessageAsync } = useChat();
    const { selectedLocation } = useLocation();
    const { getAssetFromListById } = useAsset();
    const { claimWorkOrder } = useWorkOrderBroadcast(() => {});
    const router = useRouter();

    const asset = getAssetFromListById(workOrder.assetId);

    const diff = getDayDiff(workOrder.dueDate);
    const { overdue } = resolveStatus(workOrder.status, diff);
    const dotColor = statusColor(workOrder.status, overdue);
    const label = statusLabel(workOrder.status, overdue, getStatusLabel);
    const dueLabel = formatDueLabel(diff, workOrder.dueDate);

    const dueColor =
        overdue || (diff !== null && diff < 0)
            ? 'var(--st-overdue)'
            : diff === 0
            ? 'var(--st-open)'
            : 'var(--muted-foreground)';

    const isOtherTech =
        workOrder.status === 'thread_opened' &&
        workOrder.threadOpenedBy !== user?.email;

    const isClickable =
        (workOrder.status === 'open' ||
            (workOrder.status === 'thread_opened' &&
                workOrder.threadOpenedBy === user?.email)) &&
        !isOtherTech;

    const hasLongDesc = workOrder.description?.length > 80;

    function handleOpen() {
        if (!isClickable) return;
        if (workOrder.status === 'open') {
            claimWorkOrder(workOrder.id, selectedLocation?.id ?? '', 'thread_opened');
            postMessageAsync('', workOrder.assetId, '', true, '', {
                workOrderId: workOrder.id,
                dueDate: workOrder.dueDate,
                title: workOrder.title,
            }, 'assistant');
        } else {
            router.push(`/thread?id=${workOrder.threadId}`);
        }
    }

    return (
        <Card
            className={cn(
                'overflow-hidden transition-shadow duration-150 group',
                isClickable && 'cursor-pointer hover:shadow-none',
                isOtherTech && 'opacity-60',
                workOrder.status === 'completed' && 'cursor-default',
            )}
            style={{
                borderLeft: `3px solid ${dotColor}`,
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
            }}
            onClick={handleOpen}
        >
            <CardContent className="flex flex-col gap-0 p-0">
                <div style={{ padding: '14px 16px 15px' }}>

                    {/* Row 1: Status pill + Due tag */}
                    <div className="flex items-center justify-between">
                        {/* Status pill */}
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                                color: dotColor,
                            }}
                        >
                            <span
                                className="status-dot"
                                style={{ background: dotColor }}
                            />
                            {label}
                        </span>

                        {/* Due tag */}
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: 12,
                                fontWeight: 600,
                                color: dueColor,
                                letterSpacing: '0.2px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}
                        >
                            {overdue || (diff !== null && diff < 0)
                                ? <AlertTriangle size={13} style={{ color: dueColor, flexShrink: 0 }} />
                                : <Clock size={13} style={{ color: dueColor, flexShrink: 0 }} />
                            }
                            {dueLabel}
                        </span>
                    </div>

                    {/* Row 2: Title */}
                    <p
                        className="text-foreground"
                        style={{
                            fontSize: 15,
                            fontWeight: 600,
                            marginTop: 11,
                            letterSpacing: '-0.1px',
                            lineHeight: 1.25,
                        }}
                    >
                        {workOrder.title}
                    </p>

                    {/* Row 3: Asset meta */}
                    {asset && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 9,
                                fontSize: 12.5,
                                fontWeight: 500,
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                size={13}
                                className="text-muted-foreground/50 shrink-0"
                            />
                            <span className="text-foreground shrink-0">{asset.name}</span>
                            <span className="text-muted-foreground/40 shrink-0">·</span>
                            <span className="text-muted-foreground truncate">
                                {asset.manufacturer} {asset.model}
                            </span>
                        </div>
                    )}

                    {/* Row 4: Description */}
                    <p
                        className="text-muted-foreground"
                        style={{
                            fontSize: 13,
                            marginTop: 10,
                            lineHeight: 1.55,
                        }}
                    >
                        {hasLongDesc
                            ? workOrder.description.slice(0, 80) + '…'
                            : workOrder.description}
                    </p>

                    {/* Show-more dialog trigger */}
                    {hasLongDesc && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <button
                                    className="mt-1 text-xs font-medium text-link hover:underline text-left"
                                    onClick={e => e.stopPropagation()}
                                >
                                    Show full description
                                </button>
                            </DialogTrigger>
                            <DialogContent onClick={e => e.stopPropagation()}>
                                <DialogTitle>Description</DialogTitle>
                                <DialogDescription />
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {workOrder.description}
                                </p>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Footer: attachments / work-log links */}
                {((workOrder.attachments && workOrder.attachments.length > 0) ||
                    workOrder.status === 'completed') && (
                    <div
                        className="flex gap-3 px-4 pb-3"
                        onClick={e => e.stopPropagation()}
                    >
                        {workOrder.attachments && workOrder.attachments.length > 0 && (
                            <AttachmentsDialog workOrder={workOrder}>
                                <span className="text-xs text-link font-medium cursor-pointer hover:underline">
                                    View attachments
                                </span>
                            </AttachmentsDialog>
                        )}
                        {workOrder.status === 'completed' && (
                            <WorkLogDialog workOrder={workOrder}>
                                <span className="text-xs text-link font-medium cursor-pointer hover:underline">
                                    View work logs
                                </span>
                            </WorkLogDialog>
                        )}
                    </div>
                )}

                {/* Open-thread CTA — visible for in-progress threads by this user */}
                {isClickable && workOrder.status === 'thread_opened' && (
                    <div
                        className="flex items-center gap-1 px-4 pb-3 text-xs font-semibold"
                        style={{ color: 'var(--st-progress)' }}
                    >
                        Open thread
                        <ArrowRight size={13} />
                    </div>
                )}

                {/* Claimed-by-other indicator */}
                {isOtherTech && (
                    <div className="px-4 pb-3" onClick={e => e.stopPropagation()}>
                        <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground border-border"
                        >
                            Another technician is working
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
