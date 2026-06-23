'use client';

import { useAsset } from '@/hooks/use-asset';
import { useLocation } from '@/hooks/use-location';
import messagingService from '@/services/api/messagingService';
import { ThreadDetail, ThreadDetailList } from '@/types/equipment/thread';
import { ChevronRight, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { errorToast } from '@/components/ui/sonner';

// Relative time matching the design ("3 days ago" · "Last week" · "Apr 28").
function relTime(iso: string): string {
    const d = new Date(iso);
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 14) return 'Last week';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Chats() {
    const { currentAssetId } = useAsset();
    const { selectedLocation } = useLocation();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [threadList, setThreadList] = useState<ThreadDetailList>([]);

    const getThreads = useCallback(async () => {
        try {
            if (selectedLocation && currentAssetId) {
                setIsLoading(true);
                const response = await messagingService.getThreads(
                    selectedLocation?.id ?? '',
                    currentAssetId,
                    null,
                    null,
                );
                setThreadList(response);
            }
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [selectedLocation, currentAssetId]);

    useEffect(() => {
        getThreads();
    }, [getThreads]);

    function openThread(thread: ThreadDetail) {
        router.push(`/thread?id=${thread.threadId}`);
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
                <MessageSquare
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
                    Threads
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
                    {isLoading ? '·' : threadList.length}
                </span>
            </div>

            {/* Rows */}
            {isLoading ? (
                <div style={{ padding: '6px 0' }}>
                    {[0, 1, 2].map((i) => (
                        <div key={i} style={{ padding: '11px 14px' }}>
                            <span
                                className="sk-block"
                                style={{
                                    display: 'block',
                                    width: '70%',
                                    height: 13,
                                    marginBottom: 6,
                                }}
                            />
                            <span
                                className="sk-block"
                                style={{
                                    display: 'block',
                                    width: '45%',
                                    height: 11,
                                }}
                            />
                        </div>
                    ))}
                </div>
            ) : threadList.length ? (
                threadList.map((thread, i) => (
                    <button
                        key={thread.threadId}
                        onClick={() => openThread(thread)}
                        className="group/th"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
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
                                {thread.workOrderTitle ?? thread.title}
                            </p>
                            <p
                                className="type-small"
                                style={{
                                    color: 'var(--muted-col)',
                                    marginTop: 2,
                                }}
                            >
                                {thread.messageCount} message
                                {thread.messageCount !== 1 ? 's' : ''} ·{' '}
                                {relTime(thread.createdAtUtc)}
                            </p>
                        </div>
                        <ChevronRight
                            size={15}
                            style={{ color: 'var(--muted-2)', flexShrink: 0 }}
                            className="group-hover/th:!text-foreground"
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
                    No threads yet.
                </p>
            )}
        </div>
    );
}
