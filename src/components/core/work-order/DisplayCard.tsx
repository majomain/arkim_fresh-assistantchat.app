'use client';

import { useWorkOrderBroadcast } from '@/hooks/broadcasts/use-workorder-broadcast';
import { useAsset } from '@/hooks/use-asset';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { useLocation } from '@/hooks/use-location';
import { WorkOrderDetail, WorkOrderStatus } from '@/types/workOrder/workOrder';
import { AlertTriangle, Box, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

import { cn } from '@/lib/utils';

import AttachmentsDialog from './AttachmentsDialog';
import WorkLogDialog from './WorkLogDialog';

// ── Due-date helpers ────────────────────────────────────────────────────────

function getDayDiff(dueDateStr: string): number | null {
    if (!dueDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const raw = dueDateStr.includes('T')
        ? dueDateStr
        : `${dueDateStr}T00:00:00`;
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
    const raw = dueDateStr.includes('T')
        ? dueDateStr
        : `${dueDateStr}T00:00:00`;
    return (
        'Due ' +
        new Date(raw).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        })
    );
}

// ── Status helpers ──────────────────────────────────────────────────────────

function resolveStatus(status: WorkOrderStatus, diff: number | null) {
    const overdue = status === 'open' && diff !== null && diff < 0;
    return { overdue };
}

function statusColor(status: WorkOrderStatus): string {
    switch (status) {
        case 'open':
            return 'var(--st-open)';
        case 'thread_opened':
            return 'var(--st-progress)';
        case 'completed':
            return '#0dbf98';
        case 'cancelled':
            return 'var(--st-on-hold)';
        default:
            return 'var(--muted-foreground)';
    }
}

type CardStatusPillKey = 'open' | 'on_hold' | 'in_progress' | 'completed';

const CARD_STATUS_PILLS: { key: CardStatusPillKey; label: string }[] = [
    { key: 'open', label: 'Open' },
    { key: 'on_hold', label: 'On Hold' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
];

function activeStatusPillKey(status: WorkOrderStatus): CardStatusPillKey {
    switch (status) {
        case 'open':
            return 'open';
        case 'thread_opened':
            return 'in_progress';
        case 'completed':
            return 'completed';
        case 'cancelled':
            return 'on_hold';
        default:
            return 'open';
    }
}

function jobActionLabel(
    status: WorkOrderStatus,
    canContinueThread: boolean,
): string | null {
    if (status === 'open') return 'Start Work';
    if (status === 'thread_opened') return 'Open Work';
    if (canContinueThread) return 'Continue Work';
    return null;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function DisplayCard({
    workOrder,
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
    const borderColor = statusColor(workOrder.status);
    const activePillKey = activeStatusPillKey(workOrder.status);
    const dueLabel = formatDueLabel(diff, workOrder.dueDate);

    const dueColor =
        overdue || (diff !== null && diff < 0)
            ? 'var(--st-overdue)'
            : diff === 0
              ? 'var(--st-open)'
              : 'var(--muted-foreground)';

    const isOnHold = workOrder.status === 'cancelled';

    const isOtherTech =
        workOrder.status === 'thread_opened' &&
        workOrder.threadOpenedBy !== user?.email;

    const canContinueThread =
        isOnHold &&
        !!workOrder.threadId &&
        workOrder.threadOpenedBy === user?.email;

    const isClickable =
        (workOrder.status === 'open' ||
            (workOrder.status === 'thread_opened' &&
                workOrder.threadOpenedBy === user?.email) ||
            canContinueThread) &&
        !isOtherTech;

    const hasLongDesc = workOrder.description?.length > 80;
    const actionLabel = isClickable
        ? jobActionLabel(workOrder.status, canContinueThread)
        : null;

    function handleOpen() {
        if (!isClickable) return;
        if (workOrder.status === 'open') {
            claimWorkOrder(
                workOrder.id,
                selectedLocation?.id ?? '',
                'thread_opened',
            );
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
        } else if (workOrder.threadId) {
            router.push(`/thread?id=${workOrder.threadId}`);
        }
    }

    return (
        <Card
            className={cn(
                'overflow-hidden group py-0 gap-0',
                isClickable &&
                    'card-hover-subtle card-hover-primary cursor-pointer',
                isClickable &&
                    (workOrder.status === 'thread_opened' ||
                        canContinueThread) &&
                    'card-attention',
                isOtherTech && 'opacity-60',
                !isClickable && 'cursor-default',
            )}
            style={{
                border: '1px solid var(--border-col)',
                borderLeftWidth: 8,
                borderLeftColor: borderColor,
            }}
            onClick={isClickable ? handleOpen : undefined}
            aria-label={actionLabel ?? undefined}
        >
            <CardContent className="relative flex flex-col gap-0 p-0">
                <div style={{ padding: '14px 16px 15px' }}>
                    {/* Row 1: Status track */}
                    <div
                        className="wo-card-status-track"
                        aria-label="Work order status"
                    >
                        {CARD_STATUS_PILLS.map((pill) => (
                            <span
                                key={pill.key}
                                className={cn(
                                    'wo-card-status-track-pill',
                                    pill.key === activePillKey
                                        ? pill.key === 'on_hold'
                                            ? 'wo-card-status-track-pill--active-on-hold'
                                            : pill.key === 'completed'
                                              ? 'wo-card-status-track-pill--active-completed'
                                              : 'wo-card-status-track-pill--active'
                                        : 'wo-card-status-track-pill--inactive',
                                )}
                                aria-current={
                                    pill.key === activePillKey
                                        ? 'step'
                                        : undefined
                                }
                            >
                                {pill.label}
                            </span>
                        ))}
                    </div>

                    {/* Row 2: Title */}
                    <p
                        className="type-title text-foreground"
                        style={{
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
                            className="type-body"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 9,
                                fontWeight: 500,
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                size={13}
                                className="text-muted-foreground/50 shrink-0"
                            />
                            <span className="text-foreground shrink-0">
                                {asset.name}
                            </span>
                            <span className="text-muted-foreground/40 shrink-0">
                                ·
                            </span>
                            <span className="text-muted-foreground truncate">
                                {asset.manufacturer} {asset.model}
                            </span>
                        </div>
                    )}

                    {/* Row 4: Description + Due tag */}
                    <div
                        className="flex items-end justify-between gap-3"
                        style={{ marginTop: 10 }}
                    >
                        <div className="min-w-0 flex-1">
                            <p
                                className="type-body text-muted-foreground"
                                style={{ lineHeight: 1.55 }}
                            >
                                {hasLongDesc
                                    ? workOrder.description.slice(0, 80) + '…'
                                    : workOrder.description}
                            </p>

                            {hasLongDesc && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button
                                            className="mt-1 text-xs font-medium text-link hover:underline text-left"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Show full description
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <DialogTitle>Description</DialogTitle>
                                        <DialogDescription />
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {workOrder.description}
                                        </p>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <span
                            className="type-small"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontWeight: 600,
                                color: dueColor,
                                letterSpacing: '0.2px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}
                        >
                            {overdue || (diff !== null && diff < 0) ? (
                                <AlertTriangle
                                    size={13}
                                    style={{ color: dueColor, flexShrink: 0 }}
                                />
                            ) : (
                                <Clock
                                    size={13}
                                    style={{ color: dueColor, flexShrink: 0 }}
                                />
                            )}
                            {dueLabel}
                        </span>
                    </div>
                </div>

                {/* Footer: attachments / work-log links */}
                {((workOrder.attachments && workOrder.attachments.length > 0) ||
                    workOrder.status === 'completed') && (
                    <div
                        className="flex gap-3 px-4 pb-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {workOrder.attachments &&
                            workOrder.attachments.length > 0 && (
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

                {/* Claimed-by-other indicator */}
                {isOtherTech && (
                    <div
                        className="px-4 pb-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground border-border"
                        >
                            Another technician is working
                        </Badge>
                    </div>
                )}

                {actionLabel && (
                    <div className="wo-card-action-footer">
                        <span className="wo-card-action-overlay__label">
                            {actionLabel}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
