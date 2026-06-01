'use client';

import { MessagesSquareIcon, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Search from '@/components/core/filters/Search';
import { Skeleton } from '@/components/ui/skeleton';
import CardView from './CardView';
import TableView from './TableView';
import { useAsset } from "@/hooks/use-asset";
import { useLocation } from "@/hooks/use-location";
import { errorToast, successToast } from "@/components/ui/sonner";
import messagingService from "@/services/api/messagingService";
import { useChat } from "@/hooks/use-chat";
import { useThread } from "@/hooks/use-thread";
import { ThreadAction, ThreadDetailList, ThreadStatus } from "@/types/equipment/thread";
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionHeader, AccordionItem } from '@/components/ui/accordian';
import { useDebounce } from '@/hooks/use-debounce';

export default function Chats() {
    // runtime utils
    const { currentAssetId, currentAsset } = useAsset();
    const { selectedLocation } = useLocation();
    const { isThreadProcessing, closeThread, reportThread } = useThread();
    const { removeProcessedThread, processingThreads, processedThreads } = useChat();

    // is data loading flag
    const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
    // thread list
    const [threadList, setThreadList] = useState<ThreadDetailList>([]);

    // search value
    const [search, setSearch] = useState<string>('');
    // status filter
    const [status, setStatus] = useState<'all' | ThreadStatus>('all');

    const debouncedSearch = useDebounce(search, 400);
    const isTyping = search !== debouncedSearch;

    // get list of threads
    const getThreads = useCallback(async () => {
        try {
            if (selectedLocation && currentAssetId) {
                setIsDataLoading(true);
                const response = await messagingService.getThreads(selectedLocation?.id ?? '', currentAssetId, status === 'all' ? null : status, debouncedSearch);

                setThreadList(response);
            }
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        } finally {
            setIsDataLoading(false);
        }
    }, [selectedLocation, currentAssetId, currentAsset?.threads, status, debouncedSearch]);

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
            setThreadList((prev) => prev.filter((thread) => thread.threadId != threadId));
        }
    }

    // get the date from utc timestamp
    function getDateFromTimestamp(timestamp: string) {
        const date = new Date(timestamp);

        return date.toLocaleString("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        })
            .replace(",", "");
    }

    // get threads only when location and current asset is set
    useEffect(() => {
        getThreads();
    }, [getThreads]);

    useEffect(() => {
        setStatus('all');
        setSearch('');
    }, [currentAssetId]);

    return <div className="w-full bento px-6 py-4">
        <Accordion>
            <AccordionItem hideBorder={true} defaultOpen={false}>
                <AccordionHeader>
                    <div className="flex flex-row gap-1 items-center text-sm font-medium">
                        <MessagesSquareIcon className="size-5" />
                        Threads
                        {isDataLoading ? (
                            <Skeleton className="size-4" />
                        ) : (
                            <span>
                                (
                                {threadList
                                    ? threadList.length
                                    : 0}
                                )
                            </span>
                        )}
                    </div>
                </AccordionHeader>
                <AccordionContent smoothHide={true}>
                    <div className='w-full flex justify-end mt-2 mb-4'>
                        <div className='flex flex-row items-center gap-2'>
                            <Tooltip>
                                <TooltipTrigger asChild disabled={isDataLoading || isTyping}>
                                    <Button variant='outline' size='icon' onClick={() => {
                                        if (!isDataLoading) {
                                            setSearch('');
                                            getThreads();
                                        }
                                    }}><RefreshCcw className='size-4' /></Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Refresh threads
                                </TooltipContent>
                            </Tooltip>

                            <Select
                                defaultValue="all"
                                value={status}
                                onValueChange={async (value) => {
                                    setStatus(value as 'all' | ThreadStatus);
                                }}
                                disabled={isDataLoading || isTyping}
                            >
                                <SelectTrigger className="w-fit bg-sidebar-accent hover:bg-accent hover:text-accent-foreground focus:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                    <SelectItem value="reported">Reported</SelectItem>
                                </SelectContent>
                            </Select>

                            <Search
                                search={search}
                                setSearch={setSearch}
                            />
                        </div>
                    </div>

                    <TableView
                        action={action}
                        isThreadProcessing={isThreadProcessing}
                        processingThreads={processingThreads}
                        processedThreads={processedThreads}
                        filteredThreadList={threadList}
                        isDataLoading={isDataLoading || isTyping}
                        getDateFromTimestamp={getDateFromTimestamp}
                    />

                    <CardView
                        action={action}
                        isThreadProcessing={isThreadProcessing}
                        processingThreads={processingThreads}
                        processedThreads={processedThreads}
                        filterThreadList={threadList}
                        isDataLoading={isDataLoading || isTyping}
                        getDateFromTimestamp={getDateFromTimestamp}
                    />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
}
