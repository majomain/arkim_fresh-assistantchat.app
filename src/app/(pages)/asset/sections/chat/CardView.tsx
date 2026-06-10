'use client';

import { ThreadAction, ThreadDetailList } from '@/types/equipment/thread';
import { EllipsisIcon, Loader2Icon, MessagesSquare } from 'lucide-react';
import Link from 'next/link';

import CardWithPagination from '@/components/core/CardWithPagination';
import ActionPopover from '@/components/core/work-order/ActionPopover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ChatCardView({
    filterThreadList,
    action,
    processingThreads,
    processedThreads,
    isThreadProcessing,
    isDataLoading,
    getDateFromTimestamp,
}: {
    filterThreadList: ThreadDetailList;
    action: (
        action: ThreadAction,
        threadTitle: string,
        threadId: string,
    ) => void;
    processingThreads: Record<string, string | null>;
    processedThreads: Record<string, string | null>;
    isThreadProcessing: (threadId: string) => void;
    isDataLoading: boolean;
    getDateFromTimestamp: (timestamp: string) => string;
}) {
    return (
        <div className="md:hidden">
            <CardWithPagination
                isDataLoading={isDataLoading}
                data={filterThreadList}
                renderCard={(thread) => (
                    <div
                        key={thread.threadId}
                        className="relative flex flex-col gap-4 border rounded-lg cursor-pointer"
                    >
                        {processedThreads[thread.threadId] && (
                            <span className="absolute -top-0.5 -right-1 w-1 h-1 p-1.5 bg-primary rounded-full" />
                        )}
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between">
                                <Link
                                    href={`/thread?id=${thread.threadId}`}
                                    className="text-sm font-medium items-center w-full p-3"
                                >
                                    {thread.workOrderTitle ?? thread.title}
                                </Link>

                                {processingThreads[thread.threadId] ||
                                isThreadProcessing(thread.threadId) ? (
                                    <Loader2Icon className="size-5 animate-spin mr-1 mt-1" />
                                ) : thread.status === 'open' ? (
                                    <ActionPopover
                                        action={action}
                                        threadId={thread.threadId}
                                        threadTitle={thread.title}
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="hover:!bg-transparent"
                                        >
                                            <EllipsisIcon />
                                        </Button>
                                    </ActionPopover>
                                ) : null}
                            </div>

                            <p className="px-3 text-xs text-muted-foreground -mt-6">
                                Created At:{' '}
                                {getDateFromTimestamp(
                                    thread.createdAtUtc ?? '',
                                )}
                            </p>

                            <Link
                                href={`/thread?id=${thread.threadId}`}
                                className="px-3 pb-3"
                            >
                                <Badge
                                    variant="outline"
                                    className={`border-none ${thread.status === 'open' ? 'bg-primary/15' : thread.status === 'reported' ? 'bg-success/15' : thread.status === 'closed' ? 'bg-destructive/15' : 'bg-success/15'}`}
                                >
                                    <p
                                        className={`text-xs ${thread.status === 'open' ? 'text-primary' : thread.status === 'reported' ? 'text-success' : thread.status === 'closed' ? 'text-destructive' : 'text-success'}`}
                                    >
                                        {thread.status
                                            ? thread?.status
                                                  .charAt(0)
                                                  .toUpperCase() +
                                              thread?.status.slice(1)
                                            : ''}
                                    </p>
                                </Badge>
                            </Link>
                        </div>
                    </div>
                )}
                emptyState={
                    <div className="w-full flex flex-col items-center p-5 mt-5 gap-4">
                        <MessagesSquare
                            className="text-muted-foreground w-15 h-15"
                            strokeWidth={1}
                        />
                        <div className="flex flex-col items-center">
                            <p className="text-base font-semibold">
                                No Thread Found
                            </p>
                            <p className="text-sm text-muted-foreground text-center">
                                Create a new thread for your asset
                            </p>
                        </div>
                    </div>
                }
            />
        </div>
    );
}
