'use client';

import { useChat } from '@/hooks/use-chat';
import { useThread } from '@/hooks/use-thread';
import { ThreadAction, ThreadDetail } from '@/types/equipment/thread';
import { Box, ChevronRight, Folder } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading-spinner';
import { successToast } from '../ui/sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export default function ThreadClickableUtils({
    assetName,
    currentThread,
}: {
    assetName: string;
    currentThread?: ThreadDetail | null;
}) {
    // router to redirect
    const router = useRouter();

    // thread util
    const { isThreadProcessing, closeThread, reportThread } = useThread();

    // chat util
    const { removeProcessedThread, processingThreads } = useChat();

    // action for the thread
    async function action(
        action: ThreadAction,
        threadTitle: string,
        threadId: string,
    ) {
        let result = false;
        if (action === 'close') {
            result = await closeThread(threadId);
        }

        if (action === 'report') {
            result = await reportThread(threadId);
        }

        if (result) {
            removeProcessedThread(threadId);
            successToast({
                title: 'Success',
                description: `${threadTitle} has been ${action === 'close' ? 'closed' : 'reported'}.`,
            });
            router.replace(`/asset?id=${currentThread?.assetId}`);
        }
    }

    return (
        <div className="flex flex-row justify-start items-center">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href={`/asset?id=${currentThread?.assetId}`}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hover:!bg-muted"
                        >
                            <Box className="size-4" />
                        </Button>
                    </Link>
                </TooltipTrigger>
                <TooltipContent align="start">{assetName}</TooltipContent>
            </Tooltip>

            <ChevronRight className="size-4" />

            {isThreadProcessing(currentThread?.threadId ?? '') ? (
                <div className="ml-1.5">
                    <LoadingSpinner />
                </div>
            ) : (
                <p className="ml-2 text-sm font-medium line-clamp-1">
                    {currentThread?.workOrderTitle ?? currentThread?.title}
                </p>
            )}
        </div>
    );
}
