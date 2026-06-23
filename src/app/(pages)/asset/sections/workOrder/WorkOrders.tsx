'use client';

import { useWorkOrderBroadcast } from '@/hooks/broadcasts/use-workorder-broadcast';
import { useAsset } from '@/hooks/use-asset';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { useLocation } from '@/hooks/use-location';
import workOrderService from '@/services/api/workOrderService';
import {
    WorkOrderDetail,
    WorkOrderDetailList,
    WorkOrderStatus,
} from '@/types/workOrder/workOrder';
import { ChevronRight, ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { errorToast } from '@/components/ui/sonner';

// ── Status helpers ───────────────────────────────────────────────────────────
function isOverdue(wo: WorkOrderDetail): boolean {
    if (wo.status !== 'open' && wo.status !== 'thread_opened') return false;
    if (!wo.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(
        wo.dueDate.includes('T') ? wo.dueDate : `${wo.dueDate}T00:00:00`,
    );
    return due.getTime() < today.getTime();
}

function dotColor(wo: WorkOrderDetail): string {
    if (isOverdue(wo)) return 'var(--st-overdue)';
    switch (wo.status) {
        case 'open':
            return 'var(--st-open)';
        case 'thread_opened':
            return 'var(--st-progress)';
        case 'completed':
            return 'var(--st-done)';
        case 'cancelled':
            return 'var(--st-cancel)';
        default:
            return 'var(--muted-col)';
    }
}

export default function WorkOrders() {
    const { user } = useAuth();
    const { currentAssetId } = useAsset();
    const { selectedLocation } = useLocation();
    const { postMessageAsync } = useChat();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [workOrders, setWorkOrders] = useState<WorkOrderDetailList>([]);

    const {
        claimWorkOrder,
        requestRefresh,
        updateWorkOrder,
        refreshWorkOrderList,
    } = useWorkOrderBroadcast((event) => {
        if (event.type === 'WORK_ORDER_CLAIMED')
            updateWorkOrder(
                setWorkOrders,
                event.workOrderId,
                event.siteId,
                event.status,
            );
        if (event.type === 'WORK_ORDER_LIST_REFRESH')
            refreshWorkOrderList(getWorkOrders, event.siteId, event.assetId);
    });

    const getWorkOrders = useCallback(async () => {
        try {
            if (selectedLocation && currentAssetId) {
                setIsLoading(true);
                const response = await workOrderService.getAssignedWorkOrders(
                    new Date(),
                    null,
                    currentAssetId,
                    null,
                    null,
                );
                setWorkOrders(
                    response.filter(
                        (w) =>
                            w.threadOpenedBy === null ||
                            w.threadOpenedBy === user?.email,
                    ),
                );
            }
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [selectedLocation, currentAssetId, user?.email]);

    useEffect(() => {
        getWorkOrders();
    }, [getWorkOrders]);

    // Actionable summary → hide completed/cancelled history.
    const items = useMemo(
        () =>
            workOrders.filter(
                (w) => w.status === 'open' || w.status === 'thread_opened',
            ),
        [workOrders],
    );

    function openWorkOrder(wo: WorkOrderDetail) {
        if (wo.status === 'thread_opened' && wo.threadId) {
            router.push(`/thread?id=${wo.threadId}`);
            return;
        }
        if (wo.status === 'open') {
            claimWorkOrder(wo.id, wo.siteId, 'thread_opened');
            requestRefresh(selectedLocation?.id ?? '', currentAssetId ?? '');
            postMessageAsync(
                '',
                wo.assetId,
                '',
                true,
                '',
                {
                    workOrderId: wo.id,
                    dueDate: wo.dueDate,
                    title: wo.title,
                },
                'assistant',
            );
        }
    }

    return (
        <div
            className="w-full"
            style={{
                border: '1px solid var(--border-col)',
                borderRadius: 6,
                background: 'var(--surface)',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border-soft)',
                }}
            >
                <ClipboardList
                    size={16}
                    style={{ color: 'var(--muted-col)' }}
                />
                <span
                    className="type-body"
                    style={{
                        fontWeight: 600,
                        color: 'var(--text)',
                    }}
                >
                    Work Orders
                </span>
                <span
                    className="type-small"
                    style={{
                        marginLeft: 'auto',
                        minWidth: 22,
                        textAlign: 'center',
                        fontWeight: 600,
                        color: 'var(--muted-col)',
                        background: 'var(--surface-2)',
                        borderRadius: 999,
                        padding: '1px 8px',
                    }}
                >
                    {isLoading ? '·' : items.length}
                </span>
            </div>

            {/* Rows */}
            {isLoading ? (
                <div style={{ padding: '6px 0' }}>
                    {[0, 1].map((i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '11px 14px',
                            }}
                        >
                            <span
                                className="sk-block"
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: 999,
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <span
                                    className="sk-block"
                                    style={{
                                        display: 'block',
                                        width: '60%',
                                        height: 13,
                                        marginBottom: 6,
                                    }}
                                />
                                <span
                                    className="sk-block"
                                    style={{
                                        display: 'block',
                                        width: '80%',
                                        height: 11,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : items.length ? (
                items.map((wo, i) => (
                    <button
                        key={wo.id}
                        onClick={() => openWorkOrder(wo)}
                        className="group/wo"
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            width: '100%',
                            textAlign: 'left',
                            padding: '11px 14px',
                            cursor: 'pointer',
                            background: 'transparent',
                            border: 'none',
                            borderTop:
                                i > 0 ? '1px solid var(--border-soft)' : 'none',
                            transition: 'background 120ms',
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                                'var(--surface-2)')
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                        }
                    >
                        <span
                            className="status-dot"
                            style={{
                                background: dotColor(wo),
                                marginTop: 5,
                                flexShrink: 0,
                            }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                                className="type-body"
                                style={{
                                    fontWeight: 600,
                                    color: 'var(--text)',
                                    lineHeight: 1.3,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {wo.title}
                            </p>
                            {wo.description && (
                                <p
                                    className="type-small"
                                    style={{
                                        color: 'var(--muted-col)',
                                        marginTop: 2,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {wo.description}
                                </p>
                            )}
                        </div>
                        <ChevronRight
                            size={15}
                            style={{
                                color: 'var(--muted-2)',
                                flexShrink: 0,
                                marginTop: 3,
                            }}
                            className="group-hover/wo:!text-foreground"
                        />
                    </button>
                ))
            ) : (
                <p
                    className="serif type-body"
                    style={{
                        color: 'var(--muted-col)',
                        padding: '18px 14px',
                    }}
                >
                    No open work orders.
                </p>
            )}
        </div>
    );
}
