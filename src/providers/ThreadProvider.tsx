'use client'

import { errorToast } from "@/components/ui/sonner";
import { ThreadContext } from "@/contexts/ThreadContext"
import { useThreadBroadcast } from "@/hooks/broadcasts/use-thread-broadcast";
import { useAsset } from "@/hooks/use-asset";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "@/hooks/use-location";
import messagingService from "@/services/api/messagingService";
import { ThreadDetail } from "@/types/equipment/thread";
import { clearDraftByThread } from "@/utils/draft-mechanism";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ThreadRating from "@/components/core/chat/ThreadRating";

export default function ThreadProvider({ children }: { children: React.ReactNode }) {
    // user 
    const { user } = useAuth();
    const { selectedLocation } = useLocation();

    // is thread data loading flag
    const [isThreadLoading, setIsThreadLoading] = useState<boolean>(false);
    // current thread data
    const [currentThread, setCurrentThread] = useState<ThreadDetail | null>(
        null,
    );
    // current thread id
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    // current processing threads
    const [currentProcessingThreads, setCurrentProcessingThreads] = useState<string[] | []>([]);
    // thread rating dialog state
    const [ratingThreadId, setRatingThreadId] = useState<string | null>(null);

    // router to redirect
    const router = useRouter();
    // url params
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const threadIdFromUrl = pathname.includes('/thread')
        ? searchParams.get('id')
        : null;

    // asset uitls
    const { hasBootstrapped, assetList, setCurrentAssetId, setCurrentAsset, removeThread } = useAsset();

    // broadcast setup
    const { threadStatusUpdated } = useThreadBroadcast((event) => {
        if (event.type === 'THREAD_STATUS_UPDATED') {
            removeThread(event.threadId);
            if (currentThreadId === event.threadId) {
                setCurrentThread((prev) =>
                    prev ? { ...prev, status: event.status } : prev
                );
            }
        }
    });

    // close thread by id
    async function closeThread(id: string): Promise<boolean> {
        try {
            setCurrentProcessingThreads((prev) => [...prev, id]);
            const response = await messagingService.closeThreadById(id);
            removeThread(id);

            // emit thread status updated event to update other clients
            threadStatusUpdated(id, 'closed');

            // update the thread status so that the thread page can update UI
            if (currentThreadId === id) {
                setCurrentThread((prev) =>
                    prev ? { ...prev, status: 'closed' } : prev
                );
            }

            clearDraftByThread(selectedLocation?.id ?? '', id);

            // Show thread rating dialog if not yet rated (0 = unrated)
            const threadData = await messagingService.getThreadById(id);
            if (threadData.rate === 0 || threadData.rate == null) {
                setRatingThreadId(id);
            }

            return true;
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
            if (pathname.includes('/thread')) {
                router.replace('/');
            }
            return false;
        } finally {
            setCurrentProcessingThreads((prev) => prev.filter((threadId) => threadId != id));
        }
    }

    const handleRatingClose = useCallback(() => {
        setRatingThreadId(null);
    }, []);

    // report thread by id
    async function reportThread(id: string): Promise<boolean> {
        try {
            setCurrentProcessingThreads((prev) => [...prev, id]);
            const response = await messagingService.reportThreadById(id);
            removeThread(id);

            // emit thread status updated event to update other clients
            threadStatusUpdated(id, 'reported');

            // update the thread status so that the thread page can update UI
            if (currentThreadId === id) {
                setCurrentThread((prev) =>
                    prev ? { ...prev, status: 'reported' } : prev
                );
            }

            clearDraftByThread(selectedLocation?.id ?? '', id);

            // Show thread rating dialog if not yet rated (0 = unrated)
            const threadData = await messagingService.getThreadById(id);
            if (threadData.rate === 0 || threadData.rate == null) {
                setRatingThreadId(id);
            }

            return true;
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
            if (pathname.includes('/thread')) {
                router.replace('/');
            }
            return false;
        } finally {
            setCurrentProcessingThreads((prev) => prev.filter((threadId) => threadId != id));
        }
    }

    function isThreadProcessing(id: string) {
        return currentProcessingThreads.length ? currentProcessingThreads.includes(id as never) : false;
    }

    // thread detail api
    async function fetchThreadDetail(id: string) {
        try {
            if (!assetList.length) {
                return;
            }

            setIsThreadLoading(true);
            setCurrentThread(null);

            if (id) {
                const thread = await messagingService.getThreadById(id.trim());

                // redirect back to home if thread is invalid
                if (!thread) {
                    errorToast({
                        title: 'Thread Not Found',
                        description:
                            'The thread you are looking for is either invalid or does not exist',
                    });
                    router.replace('/');
                } else {
                    // save current thread details
                    setCurrentAssetId(thread.assetId);
                    setCurrentThread(thread);
                    setCurrentThreadId(thread.threadId);
                }
            }
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        }
        finally {
            setIsThreadLoading(false);
        }
    }

    // update thread detail whenever asset list of thread id changes
    useEffect(() => {
        if (!currentThreadId) return;

        for (const asset of assetList) {
            const thread = asset.threads.find(
                t => t.threadId === currentThreadId
            );
            if (thread) {
                setCurrentThread(thread);
                return;
            }
        }
    }, [assetList, currentThreadId]);

    useEffect(() => {
        // check if user has bootsrapped asset data
        if (user && hasBootstrapped) {
            // unset current data if not thread page or else set current thread id
            if (!pathname.includes('/thread')) {
                setCurrentThreadId(null);
                setCurrentThread(null);
            }
            else if (assetList.length) {
                setCurrentThreadId(threadIdFromUrl);

                const asset = assetList.find((asset) => asset.threads.find((t) => t.threadId === threadIdFromUrl));
                if (asset) {
                    setCurrentAssetId(asset.id);
                    setCurrentAsset(asset);
                }
            }
        }
    }, [user, hasBootstrapped, threadIdFromUrl, pathname, assetList]);

    return <ThreadContext.Provider value={{
        isThreadLoading,
        currentThread,
        currentThreadId,
        currentProcessingThreads,
        setCurrentThreadId,
        setCurrentThread,
        fetchThreadDetail,
        closeThread,
        reportThread,
        isThreadProcessing
    }}>
        {children}
        {ratingThreadId && (
            <ThreadRating
                threadId={ratingThreadId}
                open={!!ratingThreadId}
                onClose={handleRatingClose}
            />
        )}
    </ThreadContext.Provider>
}