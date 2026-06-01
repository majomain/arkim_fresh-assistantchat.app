'use client';

import { ChatContext, ResponseAlertType } from '@/contexts/ChatContext';
import { useAsset } from '@/hooks/use-asset';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from '@/hooks/use-location';
import { useThread } from '@/hooks/use-thread';
import { getApiHeaders } from '@/services/api/apiClient';
import messagingService from '@/services/api/messagingService';
import { ThreadDetail } from '@/types/equipment/thread';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { errorToast } from '@/components/ui/sonner';
import { webNotify } from '@/utils/web-notification';
import { ProgressType, ReasoningType, StreamlineChatHandler, Tags } from '@/lib/streamline-chat-handler';
import { unstable_batchedUpdates } from 'react-dom';
import { useThreadBroadcast } from '@/hooks/broadcasts/use-thread-broadcast';

export type MessageUserRole = 'user' | 'assistant';

export type MessageType = {
    threadId: string;
    messageId: string;
    timestamp: string;
    role: MessageUserRole;
    userEmail: string;
    content: string;
    reasoning?: Record<Tags, { title: string; content: string } | null> | {};
    rate: number;
    runId?: string;
    ratedAtUtc?: string;
    imageUrls?: string[];
};

type ThreadMessagesMap = Record<string, MessageType[]>;

export default function ChatProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    // runtime utils
    const {
        setCurrentAssetId,
        addNewThreadToList,
        updateThreadTitle,
        placeThreadToTop,
    } = useAsset();
    const {
        currentThreadId,
        setCurrentThread,
        setCurrentThreadId,
        fetchThreadDetail,
        currentThread,
    } = useThread();
    const { selectedLocation } = useLocation();
    // user details
    const { user, refreshSession } = useAuth();
    // router to redirect
    const router = useRouter();

    // map for message for their respective threads
    const [messagesMap, setMessagesMap] = useState<ThreadMessagesMap>({});
    // list of thread to skip message loading from api after new thread creation
    const [skipFetchThreads, setSkipFetchThreads] = useState<Set<string>>(
        new Set(),
    );
    // are message loading during fetch api flag
    const [areMessagesLoading, setAreMessagesLoading] = useState(false);
    // response alerts for threads not in focus
    const [responseAlerts, setResponseAlerts] = useState<
        ResponseAlertType[] | []
    >([]);
    // threads currently streaming/processing
    const [processingThreads, setProcessingThreads] = useState<
        Record<string, string | null>
    >({});
    // unfocused processed thread
    const [processedThreads, setProcessedThreads] = useState<
        Record<string, string | null>
    >({});

    // current thread id reference for the function jobs to avoid storing initial id
    const currentThreadIdRef = useRef<string | null>(currentThreadId);
    // event controller
    const sseControllers = useRef<Map<string, AbortController>>(new Map());
    // messages for current thread
    const messages = currentThreadId ? messagesMap[currentThreadId] || [] : [];

    // sse mapping
    const [sseMap, setSSEMap] = useState<Record<string, {
        response: string;
        thinking: ProgressType;
        reasoning: ReasoningType;
        isPosting: boolean;
    }>>({});

    // sse map reference for ongoing items
    const sseMapRef = useRef<Record<string, {
        response: string;
        thinking: ProgressType;
        reasoning: ReasoningType;
        isPosting: boolean;
    }>>({});

    // broadcast setup
    const { threadCreated, threadTitleUpdated } = useThreadBroadcast((event) => {
        if (event.type === 'THREAD_CREATED') {
            addNewThreadToList(event.thread);
        }
        if (event.type === 'THREAD_TITLE_UPDATED') {
            updateThreadTitle(event.threadId, event.title);
        }
    });

    // common updater
    const updateThreadSSE = useCallback(
        (
            threadId: string,
            updater: (
                thread: {
                    response: string;
                    thinking: ProgressType;
                    reasoning: ReasoningType;
                    isPosting: boolean;
                }
            ) => {
                response?: string;
                thinking?: ProgressType;
                reasoning?: ReasoningType;
                isPosting?: boolean;
            }
        ) => {
            setSSEMap(prev => {
                const thread = prev[threadId];
                if (!thread) return prev;

                const partial = updater(thread);

                const updatedThread = {
                    ...thread,
                    ...partial,
                };

                const updated = {
                    ...prev,
                    [threadId]: updatedThread,
                };

                sseMapRef.current[threadId] = updatedThread;

                return updated;
            });
        },
        []
    );

    // set thread is posting flag
    const setThreadPosting = useCallback(
        (threadId: string, isPosting: boolean) => {
            setSSEMap(prev => {
                const thread = prev[threadId];
                if (!thread) return prev;

                const updated = {
                    ...prev,
                    [threadId]: {
                        ...thread,
                        isPosting,
                    },
                };

                sseMapRef.current[threadId] = updated[threadId];
                return updated;
            });
        },
        []
    );

    // current thread sse if any
    const currentThreadSSE = currentThreadId
        ? sseMap[currentThreadId] ?? {
            isPosting: false,
            reasoning: {},
            response: '',
            thinking: []
        } : {
            isPosting: false,
            reasoning: {},
            response: '',
            thinking: []
        };

    // is current thread posting message
    const isCurrentThreadPosting = currentThreadId
        ? sseMap[currentThreadId]?.isPosting ?? false
        : false;

    // post message or create new thread
    const postMessageAsync = useCallback(
        async (
            content: string,
            userAssetId: string | null,
            threadId: string,
            isWorkOrder: boolean,
            threadTitle?: string,
            workOrderData?: {
                workOrderId: string;
                dueDate: string;
                title: string;
            },
            role: MessageUserRole = 'user',
            attachmentUrls?: string[],
        ) => {
            // check if threadId and thread is valid or not
            if (threadId) {
                if (
                    currentThread?.threadId === threadId &&
                    currentThread?.status != 'open'
                ) {
                    errorToast({
                        title: 'Error',
                        description: `The thread is ${currentThread?.status}, can not post message.`,
                    });
                    router.replace('/');
                    return;
                }
                placeThreadToTop(threadId);
            }

            // append user prompt if thread did not start from W/O
            if (!isWorkOrder) {
                content = content.trim();
                const hasAttachments = attachmentUrls && attachmentUrls.length > 0;
                if (!content && !hasAttachments) return;

                // append user message
                setMessagesMap((prev) => ({
                    ...prev,
                    [threadId]: [
                        ...(prev[threadId] || []),
                        {
                            userAssetId,
                            userEmail: user?.email ?? '',
                            threadId,
                            messageId: crypto.randomUUID(),
                            timestamp: Date.now().toString(),
                            role,
                            content,
                            rate: 0,
                            imageUrls: attachmentUrls,
                        },
                    ],
                }));
            }

            // set cuurent asset according to the current thread
            setCurrentAssetId(userAssetId);

            // initialize sse mapping against the given threadId
            setSSEMap(prev => ({
                ...prev,
                [threadId]: {
                    response: '',
                    thinking: [],
                    reasoning: {},
                    isPosting: true
                }
            }));
            sseMapRef.current[threadId] = {
                response: '',
                thinking: [],
                reasoning: {},
                isPosting: true
            };

            // mark thread as processing for existing thread (for sidebar indicators)
            if (threadId) {
                setProcessingThreads((prev) => ({
                    ...prev,
                    [threadId]: userAssetId ?? null,
                }));
            }

            // create new controller and map it against given threadId
            const controller = new AbortController();
            sseControllers.current.set(threadId, controller);

            try {
                // make payload
                const payload = isWorkOrder
                    ? {
                        workOrderId: workOrderData?.workOrderId || '',
                    }
                    : {
                        threadId,
                        assetId: userAssetId,
                        userMessage: content,
                        ...(attachmentUrls?.length
                            ? { attachmentUrls }
                            : {}),
                    };

                console.log('[ChatProvider] Sending payload:', payload);

                // make api URL
                let url =
                    process.env.NEXT_PUBLIC_API_BASE_URL_MESSAGING;
                url =
                    url +
                    (isWorkOrder ? '/messages/from-work-order' : '/messages');

                const headers = {
                    'Content-Type': 'application/json',
                    ...getApiHeaders(),
                };

                const res = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(
                        data.detail ||
                        data.message ||
                        `HTTP Error ${res.status}`,
                    );
                }
                if (!res.body) throw new Error('No response body from server');

                // read the SSE chunks
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let responseGenerated = false;

                // stream event and its content handler
                const StreamlineHandler = new StreamlineChatHandler({
                    // updates the thinking processes list for the thread
                    updateThinking(step, tag, delta) {
                        updateThreadSSE(threadId, thread => {
                            const index = thread.thinking.findIndex(
                                t => t.step === step && t.tag === tag
                            );

                            if (index >= 0) {
                                const updated = [...thread.thinking];
                                updated[index] = {
                                    ...updated[index],
                                    content: updated[index].content + delta,
                                };
                                return { thinking: updated };
                            }
                            return {};
                        });
                    },
                    // updates the reasoning(present in the message) list for the thread
                    updateReasoning(tag, delta) {
                        updateThreadSSE(threadId, thread => {
                            const existing = thread.reasoning[tag] ?? {
                                title: tag,
                                content: '',
                            };

                            return {
                                reasoning: {
                                    ...thread.reasoning,
                                    [tag]: {
                                        ...existing,
                                        content: existing.content + delta,
                                    },
                                },
                            };
                        });
                    },
                    // append new thinking process entry
                    appendThinking(entry) {
                        updateThreadSSE(threadId, thread => {
                            const exists = thread.thinking.some(
                                t => t.step === entry.step && t.tag === entry.tag
                            );

                            if (!exists) {
                                return {
                                    thinking: [...thread.thinking, entry]
                                };
                            }

                            return {};
                        });
                    },
                    // append new reasoning entry
                    appendReasoning(reasoning) {
                        updateThreadSSE(threadId, thread => {
                            const tag = Object.keys(reasoning)[0] as Tags;
                            const value = reasoning[tag];

                            return {
                                reasoning: {
                                    ...thread.reasoning,
                                    [tag]: value,
                                },
                            };
                        });
                    },
                    // append final response(assistant's message)
                    appendResponse(delta) {
                        updateThreadSSE(threadId, thread => ({
                            response: thread.response + delta,
                        }));
                    },
                });

                // process chunks block
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    buffer += decoder.decode(value, { stream: true });

                    const parts = buffer.split('\n\n');
                    buffer = parts.pop() || '';

                    for (const part of parts) {
                        // event
                        const eventMatch = part.match(/^event: (.+)$/m);
                        // event data
                        const dataMatch = part.match(/^data: (.+)$/m);
                        if (!dataMatch || !eventMatch) continue;

                        try {
                            const data = JSON.parse(dataMatch[1]);

                            // handle events
                            switch (eventMatch[1]) {
                                case 'new_thread':
                                    const newThreadId = data.thread_id ?? threadId;

                                    // mark thread as processing (for sidebar indicators)
                                    setProcessingThreads((prev) => ({
                                        ...prev,
                                        [newThreadId]: userAssetId ?? null,
                                    }));

                                    if (!isWorkOrder) {
                                        // add user message to new thread
                                        setMessagesMap((prev) => ({
                                            ...prev,
                                            [newThreadId]: [
                                                ...(prev[newThreadId] || []),
                                                {
                                                    userAssetId,
                                                    threadId: newThreadId,
                                                    messageId: crypto.randomUUID(),
                                                    timestamp:
                                                        Date.now().toString(),
                                                    role: 'user',
                                                    content,
                                                    imageUrls: attachmentUrls,
                                                },
                                            ],
                                        }));
                                    }

                                    // make new thread data
                                    const newThreadData: ThreadDetail = {
                                        assetId: userAssetId ?? '',
                                        threadId: newThreadId,
                                        userEmail: user?.email ?? '',
                                        companyId:
                                            localStorage.getItem(
                                                'selectedCompanyId',
                                            ) ?? '',
                                        siteId: selectedLocation?.id ?? '',
                                        createdAtUtc: Date.now().toString(),
                                        messageCount: 2,
                                        isProcessing: true,
                                        status: 'open',
                                        currentProcessingStatus: 'completed',
                                        rate: 0,
                                        title: isWorkOrder ? workOrderData?.title ?? '' : '',
                                        startedFromWorkOrder: isWorkOrder ?? false,
                                    };

                                    // emit thread created event to update other clients
                                    threadCreated(newThreadData);

                                    // add new thread to sidebar list
                                    addNewThreadToList(newThreadData);
                                    // set current thread 
                                    setCurrentThread(newThreadData);
                                    setCurrentThreadId(newThreadId);

                                    // redirect to thread page
                                    router.push(`/thread?id=${newThreadId}`);
                                    threadId = newThreadId;

                                    // initialize sse mapping against the new threadId
                                    setSSEMap(prev => ({
                                        ...prev,
                                        [threadId]: {
                                            response: '',
                                            thinking: [],
                                            reasoning: {},
                                            isPosting: true
                                        }
                                    }));
                                    sseMapRef.current[threadId] = {
                                        response: '',
                                        thinking: [],
                                        reasoning: {},
                                        isPosting: true
                                    };

                                    break;
                                case 'title':
                                    threadTitle = isWorkOrder ? workOrderData?.title ?? '' : data.title;
                                    // emit title updated event to update other clients
                                    threadTitleUpdated(threadId, threadTitle ?? '');
                                    // update the title in UI
                                    updateThreadTitle(threadId, threadTitle ?? '');
                                    break;
                                case 'progress': StreamlineHandler.handleProgressEvent(data); break;
                                case 'tag_start': StreamlineHandler.handleTagStartEvent(data); break;
                                case 'delta': unstable_batchedUpdates(() => { StreamlineHandler.handleDeltaEvent(data); }); break;
                                case 'tag_end':
                                    StreamlineHandler.handleTagEndEvent(data);
                                    // if the tag ended for final response(assistant's message) then set flag true
                                    if (data.tag === 'final_answer') {
                                        responseGenerated = true;
                                    }
                                    break;
                                case 'error':
                                    // handle error event from server
                                    const errorMessage =
                                        data.message ||
                                        data.error ||
                                        'An error occurred while processing your request';
                                    console.error(
                                        '[ChatProvider] Server error:',
                                        data,
                                    );
                                    errorToast({
                                        title: 'Error',
                                        description: errorMessage,
                                    });
                                    setThreadPosting(threadId, false);
                                    break;
                            }

                            // add new thread to skip thread messages fetch list
                            setSkipFetchThreads((prev) =>
                                new Set(prev).add(threadId),
                            );
                        } catch {
                            console.warn('Malformed SSE chunk:', part);
                        }
                    }
                }

                // add assistant final message
                if (responseGenerated) {
                    const finalSSE = sseMapRef.current[threadId];
                    // add the final message
                    setMessagesMap((prev) => ({
                        ...prev,
                        [threadId]: [
                            ...(prev[threadId] || []),
                            {
                                userAssetId,
                                userEmail: user?.email ?? '',
                                threadId,
                                messageId: crypto.randomUUID(),
                                timestamp: Date.now().toString(),
                                role: 'assistant',
                                content: finalSSE.response,
                                reasoning: finalSSE.reasoning,
                                rate: 0,
                            },
                        ],
                    }));

                    // send alert if user is on anohter thread and previous thread's response is ready
                    if (threadId !== currentThreadIdRef.current) {
                        setProcessedThreads((prev) => ({
                            ...prev,
                            [threadId]: userAssetId ?? null,
                        }));
                        setResponseAlerts((prev) => [
                            ...prev,
                            {
                                id: crypto.randomUUID(),
                                threadId: threadId,
                                title: threadTitle ?? 'Untitled',
                                description: finalSSE.response,
                                timestamp: Date.now()
                            },
                        ]);
                    } else if (document.visibilityState !== 'visible') {
                        webNotify(
                            threadTitle ?? 'Untitled',
                            {
                                body: finalSSE.response,
                                tag: 'thread_response',
                            },
                            () => {
                                window.focus();
                                router.push(`/thread?id=${threadId}`);
                            },
                        );
                    }
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    errorToast({ title: 'Error', description: error.message });
                }
            } finally {
                setThreadPosting(threadId, false);

                sseControllers.current.delete(threadId);

                // refresh messages from server to get real IDs (local messages use crypto.randomUUID)
                try {
                    const serverMessages = await messagingService.getMessagesByThread(threadId);
                    setMessagesMap((prev) => ({ ...prev, [threadId]: serverMessages }));
                } catch {
                    // non-critical — local messages still shown
                }

                // remove the thread from skip fetch
                setSkipFetchThreads((prev) => {
                    const next = new Set(prev);
                    next.delete(threadId);
                    return next;
                });

                // remove thread from processing list
                setProcessingThreads((prev) => {
                    const copy = { ...prev };
                    delete copy[threadId];
                    return copy;
                });

            }
        },
        [
            user?.email,
            placeThreadToTop,
            addNewThreadToList,
            updateThreadTitle,
            router,
            currentThread,
            setCurrentAssetId,
            setSSEMap,
            setProcessingThreads,
            setMessagesMap,
            setCurrentThread,
            setCurrentThreadId,
            setSkipFetchThreads,
            setProcessedThreads,
            setResponseAlerts,
            selectedLocation,
            updateThreadSSE,
            setThreadPosting,
        ],
    );

    // fetch thread messages
    async function fetchThreadMessages(threadId: string) {
        if (skipFetchThreads.has(threadId)) return;

        try {
            setAreMessagesLoading(true);
            const data = await messagingService.getMessagesByThread(threadId);
            setMessagesMap((prev) => ({ ...prev, [threadId]: data }));
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
            console.log(error)
            if (error?.response?.status === 404) {
                router.push('/');
            }
            if (error?.response?.status === 403) {
                refreshSession();
            }
        } finally {
            setAreMessagesLoading(false);
        }
    }

    // remove/delete processed thread from list
    const removeProcessedThread = useCallback((id: string) => {
        setProcessedThreads((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });

        setResponseAlerts((prev) =>
            prev.filter((alert) => alert.threadId !== id),
        );
    }, []);

    // remove/delete alert from list
    const removeResponseAlert = useCallback((id: string) => {
        setResponseAlerts((prev) => prev.filter((a) => a.id !== id));
    }, []);

    // fetch thread's messages only if thread already exist
    useEffect(() => {
        currentThreadIdRef.current = currentThreadId;

        if (currentThreadId) {
            setAreMessagesLoading(false);
            fetchThreadMessages(currentThreadId);
            if (!skipFetchThreads.has(currentThreadId))
                fetchThreadDetail(currentThreadId);
            removeProcessedThread(currentThreadId);
        }
    }, [currentThreadId]);

    // setup the events and controllers
    useEffect(() => {
        const handleUnload = () =>
            sseControllers.current.forEach((controller) => controller.abort());
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);

    const contextValue = useMemo(
        () => ({
            sse: currentThreadSSE,
            areMessagesLoading,
            messages,
            setMessages: (msgs: MessageType[]) => {
                if (!currentThreadId) return;
                setMessagesMap((prev) => ({
                    ...prev,
                    [currentThreadId]: msgs,
                }));
            },
            postMessageAsync,
            responseAlerts,
            removeResponseAlert,
            processingThreads,
            processedThreads,
            removeProcessedThread,
        }),
        [
            isCurrentThreadPosting,
            currentThreadSSE,
            areMessagesLoading,
            messages,
            currentThreadId,
            postMessageAsync,
            responseAlerts,
            removeResponseAlert,
            processingThreads,
            processedThreads,
            removeProcessedThread,
        ],
    );
    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
}
