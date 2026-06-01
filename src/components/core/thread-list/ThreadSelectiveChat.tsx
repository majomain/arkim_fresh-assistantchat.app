'use client';

import { useChat } from '@/hooks/use-chat';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useThread } from '@/hooks/use-thread';
import { ThreadAction, ThreadDetail, ThreadDetailList } from '@/types/equipment/thread';
import { Ellipsis, Loader2 } from 'lucide-react';
import ActionPopover from '../work-order/ActionPopover';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { successToast } from '@/components/ui/sonner';

export default function ThreadSelectiveChat({
    threads,
    hidden
}: {
    threads: ThreadDetailList;
    hidden?: boolean;
}) {
    // runtime thread data
    const { currentThreadId, isThreadProcessing, closeThread, reportThread } = useThread();

    // runtime chat data
    const { processingThreads, processedThreads, removeProcessedThread } = useChat();
    // router for redirection
    const router = useRouter();
    // sidebar utils
    const { isMobile, toggleSidebar, scrollRef } = useSidebar();

    // current ellipsis menu visibility flag
    const [currentEllipsis, setCurrentEllipsis] = useState<string | null>(null);

    // get thread title as per workorder existence
    function getThreadTitle(thread: ThreadDetail) {
        return thread.workOrderTitle ?? thread.title;
    }

    // action for the thread
    async function action(action: ThreadAction, threadTitle: string, threadId: string) {
        let result = false;
        if (action === 'close') {
            result = await closeThread(threadId);
        }

        if (action === 'report') {
            result = await reportThread(threadId);
        }

        if (result) {
            removeProcessedThread(threadId);
            successToast({ title: 'Success', description: `${threadTitle} has been ${action === 'close' ? 'closed' : 'reported'}.` });
        }
    }

    const activeThreadRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!activeThreadRef.current || !scrollRef.current) return;

        activeThreadRef.current.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
        });
    }, [currentThreadId]);


    return (
        threads.length > 0 && (
            <div className={clsx('flex flex-col items-stretch gap-1 border-l ml-2.5 textarea-slide-down', hidden && 'hidden')}>
                {threads.map((thread) => {
                    return (
                        <div ref={thread.threadId === currentThreadId ? activeThreadRef : null} key={thread.threadId} className={clsx(
                            'group/thread-item rounded-e-md flex flex-row justify-between items-center text-sm cursor-pointer hover:bg-sidebar-accent',
                            {
                                'bg-sidebar-accent': thread.threadId === currentEllipsis,
                                ['bg-sidebar-primary font-medium']:
                                    thread.threadId ===
                                    currentThreadId,
                            },
                        )}
                        >

                            <div className="w-full flex flex-row items-center justify-between">
                                <Tooltip delayDuration={600}>
                                    <TooltipTrigger asChild>
                                        <p className='py-2 pl-2 pr-2.5 text-start flex-1 truncate' onClick={() => {
                                            if (isMobile) toggleSidebar();
                                            router.push(
                                                `/thread?id=${thread.threadId}`,
                                            );
                                        }}>
                                            {
                                                getThreadTitle(thread) &&
                                                    getThreadTitle(thread) !== ''
                                                    ? getThreadTitle(thread)
                                                    : 'New chat'
                                            }
                                        </p>
                                    </TooltipTrigger>
                                    {
                                        getThreadTitle(thread) &&
                                        getThreadTitle(thread) !== '' &&
                                        getThreadTitle(thread).length > 20 && (
                                            <TooltipContent
                                                side={isMobile ? 'top' : 'right'}
                                            >
                                                {getThreadTitle(thread)}
                                            </TooltipContent>
                                        )

                                    }
                                </Tooltip>

                                {((processingThreads[thread.threadId] &&
                                    currentThreadId !== thread.threadId) ||
                                    isThreadProcessing(thread.threadId)) && (
                                        <Loader2 className='size-4 animate-spin mr-2.5' strokeWidth={3} />
                                    )}

                                {processedThreads[thread.threadId] &&
                                    currentThreadId !== thread.threadId &&
                                    !isThreadProcessing(thread.threadId) &&
                                    (
                                        <span className="w-1 h-1 p-1 mr-4 bg-primary rounded-full" />
                                    )}

                                {
                                    !processingThreads[thread.threadId] &&
                                    !processedThreads[thread.threadId] &&
                                    !isThreadProcessing(thread.threadId) &&
                                    <ActionPopover
                                        action={action}
                                        threadId={thread.threadId}
                                        threadTitle={thread.title}
                                        side='right'
                                        align='start'
                                        onOpenChange={(open) =>
                                            setCurrentEllipsis(open ? thread.threadId : null)
                                        }
                                    >
                                        <button
                                            className={cn(
                                                'pr-1.5 rounded-md text-foreground',
                                                currentThreadId === thread.threadId ||
                                                    currentEllipsis === thread.threadId ||
                                                    isMobile
                                                    ? 'opacity-100'
                                                    : 'opacity-0 group-hover/thread-item:opacity-100'
                                            )}
                                        >
                                            <Ellipsis className='size-4' strokeWidth={2} />
                                        </button>
                                    </ActionPopover>
                                }
                            </div>
                        </div>
                    );
                })}
            </div>
        )
    );
}
