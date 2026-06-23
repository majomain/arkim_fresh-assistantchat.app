'use client';

import { useAsset } from '@/hooks/use-asset';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { useThread } from '@/hooks/use-thread';
import { ThreadAction } from '@/types/equipment/thread';
import {
    Archive,
    ArrowDownIcon,
    CheckCircle2,
    ClipboardList,
    Star,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { TooltipIconButton } from '@/components/core/TooltipIconButton';
import MessageSkeleton from '@/components/core/chat/MessageSkeleton';
import Messages from '@/components/core/chat/Messages';
import ResponseMaker from '@/components/core/chat/ResponseMaker';
import StreamTimeline from '@/components/core/chat/StreamTimeline';
import TextArea from '@/components/core/chat/TextArea';
import CreateWorkOrderDialog from '@/components/core/work-order/CreateWorkOrderDialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { successToast } from '@/components/ui/sonner';

import { cn } from '@/lib/utils';

export default function ThreadPage() {
    // user details
    const { user, refreshSession } = useAuth();
    // get thread id from URL query params
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const threadIdFromUrl = searchParams.get('id');
    const threadIdFromUrlExist =
        pathname.includes('/thread') && threadIdFromUrl ? true : false;
    const router = useRouter();

    // runtime utils
    const { currentAsset } = useAsset();
    const {
        currentThreadId,
        currentThread,
        setCurrentThreadId,
        isThreadProcessing,
        reportThread,
        closeThread,
    } = useThread();

    // scrollable container reference
    const containerRef = useRef<HTMLDivElement | null>(null);
    // scroll button visibility flag
    const [showScrollButton, setShowScrollButton] = useState(false);
    // chat utils
    const { messages, areMessagesLoading, sse, removeProcessedThread } =
        useChat();

    // thread action utils
    const [open, setOpen] = useState<boolean>(false);
    const [selectedAction, setSelectedAction] = useState<ThreadAction | null>(
        null,
    );
    const [workOrderDialogOpen, setWorkOrderDialogOpen] =
        useState<boolean>(false);
    const loadDialog = (action: ThreadAction) => {
        setSelectedAction(action);
        setOpen(true);
    };

    const scrollRAFRef = useRef<number | null>(null);

    // tracks whether user has manually paused auto-scroll (by scrolling up or closing timeline)
    const userPausedScrollRef = useRef<boolean>(false);

    // handle scroll
    function handleScroll() {
        const container = containerRef.current;
        if (!container) return;
        const atBottom =
            container.scrollHeight -
                container.scrollTop -
                container.clientHeight <=
            20;
        setShowScrollButton(!atBottom);

        // if user scrolled up while streaming → pause auto-scroll
        if (!atBottom && sse.isPosting) {
            userPausedScrollRef.current = true;
        }

        // if user scrolled back to bottom → resume auto-scroll
        if (atBottom) {
            userPausedScrollRef.current = false;
        }
    }

    // scroll to bottom
    function scrollToBottom() {
        // Cancel pending scroll
        if (scrollRAFRef.current) {
            cancelAnimationFrame(scrollRAFRef.current);
        }

        // Schedule on next animation frame
        scrollRAFRef.current = requestAnimationFrame(() => {
            containerRef.current?.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: sse.isPosting ? 'auto' : 'smooth', // Instant while streaming
            });
        });
    }

    // action for the thread
    async function action(
        action: ThreadAction,
        threadTitle: string,
        threadId: string,
    ) {
        const threadIdAtActionTime = threadIdFromUrl;

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

            const currentParams = new URLSearchParams(window.location.search);
            const currentThreadIdInUrl = currentParams.get('id');

            if (
                threadIdAtActionTime &&
                currentThreadIdInUrl === threadIdAtActionTime
            ) {
                router.replace('/');
            }
        }
    }

    // get assistant response count
    const assistantMessageCount = useMemo(
        () => messages.filter((m) => m.role === 'assistant').length,
        [messages],
    );

    const hasAttachments = useMemo(
        () => messages.some((m) => m.imageUrls && m.imageUrls.length > 0),
        [messages],
    );

    useEffect(() => {
        if (threadIdFromUrl && threadIdFromUrlExist && messages.length > 0) {
            scrollToBottom();
            setShowScrollButton(false);
        }
    }, [threadIdFromUrlExist, threadIdFromUrl, messages]);

    // auto-scroll during streaming whenever thinking steps or response content updates (respects user pause)
    useEffect(() => {
        if (sse.isPosting && !userPausedScrollRef.current) {
            scrollToBottom();
        }
    }, [sse.thinking, sse.response, sse.isPosting]);

    // reset pause state when streaming stops so next stream starts fresh
    useEffect(() => {
        if (!sse.isPosting) {
            userPausedScrollRef.current = false;
        }
    }, [sse.isPosting]);

    // set currentThreadId from URL when component mounts or URL changes
    useEffect(() => {
        if (threadIdFromUrl && threadIdFromUrl !== currentThreadId) {
            setCurrentThreadId(threadIdFromUrl);
        }
    }, [threadIdFromUrl]);

    // if thread id does not exist in URL param, redirect to home
    useEffect(() => {
        if (!threadIdFromUrlExist) {
            router.replace('/');
        }
    }, [threadIdFromUrlExist]);

    useEffect(() => {
        return () => {
            if (scrollRAFRef.current) {
                cancelAnimationFrame(scrollRAFRef.current);
            }
        };
    }, []);

    if (!user || !currentThreadId) return null;

    return (
        <div className="flex flex-col justify-center items-center h-[91dvh] w-full">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className={cn(
                    'scrollable flex flex-col items-center w-full h-full overflow-auto',
                    { 'h-screen': areMessagesLoading },
                )}
            >
                {areMessagesLoading ? (
                    <>
                        <MessageSkeleton />
                        <div className="w-full md:w-lg lg:w-full max-w-3xl flex flex-col items-center fixed bottom-2 px-2 lg:px-0">
                            <Skeleton className="p-7 w-full" />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col w-full max-w-3xl px-2 pb-15">
                        {/* user and assistant messages */}
                        <Messages messages={messages} />

                        {/* streamlining thinking process */}
                        {sse.isPosting && (
                            <StreamTimeline
                                steps={sse.thinking}
                                hasResponseArrived={sse.response ? true : false}
                                onClose={() => {
                                    userPausedScrollRef.current = true;
                                }}
                            />
                        )}

                        {/* streaming assistant response */}
                        {sse.isPosting && (
                            <div
                                style={{ contain: 'layout style paint' }}
                                className="px-3"
                            >
                                <ResponseMaker content={sse.response} />
                            </div>
                        )}

                        {/* show star rating for rated threads */}
                        {currentThread?.rate != null &&
                            currentThread.rate > 0 &&
                            currentThread.status !== 'open' && (
                                <div className="flex flex-row items-center justify-center gap-1 py-2">
                                    <span className="text-sm text-muted-foreground mr-1">
                                        Your rating:
                                    </span>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={cn(
                                                'w-5 h-5',
                                                star <= currentThread.rate!
                                                    ? 'text-yellow-500 fill-yellow-500'
                                                    : 'text-muted-foreground',
                                            )}
                                        />
                                    ))}
                                </div>
                            )}

                        {/* Thread action buttons — spec §4: brand-refined, not saturated */}
                        {!sse.isPosting &&
                            !isThreadProcessing(
                                currentThread?.threadId ?? '',
                            ) &&
                            currentThread?.status === 'open' &&
                            assistantMessageCount >= 1 && (
                                <div className="pop-up flex flex-col items-center gap-3 mt-2">
                                    <div className="flex flex-row gap-2">
                                        {/* Report — sage/checkCircle treatment */}
                                        <button
                                            onClick={() => loadDialog('report')}
                                            className="type-body"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                fontWeight: 600,
                                                padding: '9px 16px',
                                                borderRadius: 3,
                                                background:
                                                    'var(--st-done-fill)',
                                                color: 'var(--st-done)',
                                                border: '1px solid color-mix(in srgb, var(--st-done) 28%, transparent)',
                                                cursor: 'pointer',
                                                transition: 'filter 140ms',
                                            }}
                                        >
                                            <CheckCircle2 className="size-4" />{' '}
                                            Report
                                        </button>

                                        {/* Close — neutral/quiet */}
                                        <button
                                            onClick={() => loadDialog('close')}
                                            className="type-body"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                fontWeight: 600,
                                                padding: '9px 16px',
                                                borderRadius: 3,
                                                background: 'var(--surface-2)',
                                                color: 'var(--muted-col)',
                                                border: '1px solid var(--border-col)',
                                                cursor: 'pointer',
                                                transition: 'background 140ms',
                                            }}
                                        >
                                            <Archive className="size-4" /> Close
                                        </button>

                                        {/* Create WO — accent-filled */}
                                        {!currentThread?.startedFromWorkOrder && (
                                            <button
                                                onClick={() =>
                                                    setWorkOrderDialogOpen(true)
                                                }
                                                className="type-body"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    fontWeight: 600,
                                                    padding: '9px 16px',
                                                    borderRadius: 3,
                                                    background:
                                                        'var(--accent-col)',
                                                    color: 'var(--on-accent)',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'filter 140ms',
                                                }}
                                            >
                                                <ClipboardList className="size-4" />{' '}
                                                Create WO
                                            </button>
                                        )}
                                    </div>

                                    {/* Confirmation dialog — spec §6 */}
                                    <Dialog
                                        open={open}
                                        onOpenChange={() => setOpen(!open)}
                                    >
                                        <DialogTrigger />
                                        <DialogContent
                                            className="max-w-sm"
                                            hideCloseButton
                                            style={{
                                                borderRadius: 4,
                                                border: '1px solid var(--border-col)',
                                                background: 'var(--surface)',
                                            }}
                                        >
                                            <DialogHeader>
                                                <DialogTitle
                                                    className="type-title"
                                                    style={{
                                                        fontWeight: 600,
                                                        color: 'var(--text-strong)',
                                                        textAlign: 'left',
                                                    }}
                                                >
                                                    Confirmation required
                                                </DialogTitle>
                                                <DialogDescription />
                                            </DialogHeader>
                                            <p
                                                className="type-body"
                                                style={{
                                                    color: 'var(--text)',
                                                    lineHeight: 1.55,
                                                    marginTop: 2,
                                                }}
                                            >
                                                Are you sure you want to{' '}
                                                {selectedAction}{' '}
                                                <strong>
                                                    {currentThread?.title ?? ''}
                                                </strong>
                                                ?
                                            </p>
                                            <p
                                                className="type-body"
                                                style={{
                                                    color: 'var(--muted-col)',
                                                    marginTop: 6,
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {selectedAction === 'report'
                                                    ? 'Arkim will summarize the thread, mark the work order done and archive it.'
                                                    : 'The thread closes and the work order is released back to the queue.'}
                                            </p>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: 10,
                                                    marginTop: 18,
                                                }}
                                            >
                                                <button
                                                    className="btn-accent"
                                                    style={{
                                                        flex: 1,
                                                        justifyContent:
                                                            'center',
                                                    }}
                                                    onClick={() => {
                                                        setOpen(false);
                                                        if (selectedAction)
                                                            action(
                                                                selectedAction,
                                                                currentThread?.title ??
                                                                    '',
                                                                currentThread?.threadId ??
                                                                    '',
                                                            );
                                                    }}
                                                >
                                                    <CheckCircle2 className="size-4" />{' '}
                                                    Confirm
                                                </button>
                                                <button
                                                    className="btn-ghost"
                                                    style={{
                                                        flex: 1,
                                                        justifyContent:
                                                            'center',
                                                    }}
                                                    onClick={() =>
                                                        setOpen(false)
                                                    }
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                    <CreateWorkOrderDialog
                                        open={workOrderDialogOpen}
                                        onOpenChange={setWorkOrderDialogOpen}
                                        threadId={currentThread?.threadId ?? ''}
                                        threadTitle={currentThread?.title ?? ''}
                                        hasAttachments={hasAttachments}
                                        onSuccess={async () => {
                                            const threadId =
                                                currentThread?.threadId ?? '';
                                            const result =
                                                await closeThread(threadId);
                                            if (result) {
                                                removeProcessedThread(threadId);
                                                router.replace('/');
                                            }
                                        }}
                                    />
                                </div>
                            )}
                    </div>
                )}
            </div>
            <div className="w-full max-w-3xl flex flex-col items-center sticky bottom-0 px-2 lg:px-0">
                {/* scroll to top button */}
                {showScrollButton && (
                    <TooltipIconButton
                        tooltip="Scroll to bottom"
                        variant="outline"
                        className="!bg-background pop-up w-8 h-8 absolute -top-14 rounded-full"
                        onClick={scrollToBottom}
                    >
                        <ArrowDownIcon />
                    </TooltipIconButton>
                )}

                {/* chat textbox */}
                {currentThread?.status === 'open' && !areMessagesLoading && (
                    <TextArea
                        key={currentThreadId}
                        assetTitle={currentAsset?.name}
                    />
                )}
            </div>
        </div>
    );
}
