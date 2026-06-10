'use client';

import { useAsset } from '@/hooks/use-asset';
import { useLocation } from '@/hooks/use-location';
import messagingService from '@/services/api/messagingService';
import { ThreadDetailList } from '@/types/equipment/thread';
import { Box, MessageSquareText, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { errorToast } from '@/components/ui/sonner';

import { cn } from '@/lib/utils';

export default function ThreadSearch({
    isTyping,
    search,
    closeDialog,
}: {
    isTyping: boolean;
    search: string;
    closeDialog: () => void;
}) {
    // asset utils
    const { isAssetListLoading, getAssetFromListById } = useAsset();
    // location util
    const { selectedLocation } = useLocation();
    const router = useRouter();

    const [threads, setThreads] = useState<ThreadDetailList>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // get list of threads
    const getThreads = useCallback(async () => {
        try {
            if (!search) {
                setThreads([]);
                return;
            }

            if (selectedLocation) {
                setIsLoading(true);

                // Fetch threads from messaging service
                const response = await messagingService.getOpenThreads(
                    selectedLocation.id,
                    search,
                );

                setThreads(response);
            }
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [selectedLocation, search]);

    useEffect(() => {
        getThreads();
    }, [getThreads]);

    return isLoading || isAssetListLoading || isTyping ? (
        <div className="flex flex-col gap-2 max-h-[60dvh] overflow-y-auto px-2 scrollable">
            {Array.from({ length: 1 }).map((_, index) => (
                <Skeleton key={index} className="h-35 w-full rounded-lg" />
            ))}
        </div>
    ) : threads.length ? (
        <div className="grid grid-cols-1 gap-2 max-h-[60dvh] overflow-y-auto px-2 scrollable">
            {threads.map((thread, index) => {
                const asset = getAssetFromListById(thread.assetId);
                return (
                    <Card
                        key={thread.threadId}
                        className="cursor-pointer hover:shadow-none"
                        onClick={() => {
                            closeDialog();
                            router.push(`/thread/?id=${thread.threadId}`);
                        }}
                    >
                        <CardContent className="flex flex-col gap-1.5 h-full">
                            <p className="text-base font-semibold">
                                {thread.workOrderTitle ?? thread.title}
                            </p>

                            <div className="flex-1" />

                            <div className={cn('flex flex-col gap-1')}>
                                <Separator />

                                <p className="mt-2 text-sm font-medium flex flex-row items-center gap-1">
                                    <Box className="size-4" />
                                    Asset Detail
                                </p>

                                <div className="grid grid-cols-2 gap-1.5 pl-0.5">
                                    <p className="text-xs flex flex-col items-start font-medium text-muted-foreground">
                                        Name
                                        <span className="!font-normal">
                                            {asset?.name ?? '-'}
                                        </span>
                                    </p>
                                    <p className="text-xs flex flex-col items-start font-medium text-muted-foreground">
                                        Type
                                        <span className="!font-normal">
                                            {asset?.type ?? '-'}
                                        </span>
                                    </p>
                                    <p className="text-xs flex flex-col items-start font-medium text-muted-foreground">
                                        Manufacturer
                                        <span className="!font-normal">
                                            {asset?.manufacturer ?? '-'}
                                        </span>
                                    </p>
                                    <p className="text-xs flex flex-col items-start font-medium text-muted-foreground">
                                        Model
                                        <span className="!font-normal">
                                            {asset?.model ?? '-'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    ) : (
        <div className="w-full flex flex-col justify-center items-center mb-10">
            <div className="p-3 flex justify-center items-center bg-transparent cursor-default">
                {search ? (
                    <MessageSquareText
                        className="w-16 h-16 text-muted-foreground"
                        strokeWidth={1}
                    />
                ) : (
                    <SearchIcon
                        className="w-16 h-16 text-muted-foreground"
                        strokeWidth={1}
                    />
                )}
            </div>
            <div className="flex flex-col gap-2 items-center justify-center text-center">
                <h3 className="text-base font-semibold">
                    {search ? 'No threads found' : 'Start typing to search'}
                </h3>
            </div>
        </div>
    );
}
