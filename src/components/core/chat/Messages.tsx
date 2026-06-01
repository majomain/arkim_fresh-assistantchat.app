'use client';

import { MessageType } from '@/providers/ChatProvider';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { errorToast } from '@/components/ui/sonner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

import ResponseMaker from './ResponseMaker';
import ThoughtProcess from './ThoughtProcess';
import MessageRating from './MessageRating';
import ImageViewer, { ImageViewerProvider } from '@/components/ui/image-viewer';
import useImageError from '@/hooks/use-image-error';

export default function Messages({ messages }: { messages: MessageType[]}) {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const {handleImageError} = useImageError();
    // track message IDs that have already played their entrance animation so
    // they don't re-animate on every re-render (e.g. during parent state changes)
    const animatedIds = useRef<Set<string>>(new Set());

    const handleCopy = useCallback(async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            errorToast({
                title: 'Error',
                description: 'Failed to copy the content',
            });
        }
    }, []);

    if (!messages?.length) return null;

    return (
        <>
            {messages.map((message, idx) => {
                const isNew = !animatedIds.current.has(message.messageId);
                if (isNew) animatedIds.current.add(message.messageId);

                const isUser = message.role === 'user';
                const isCopied = copiedId === message.messageId;

                return (
                    <div
                        key={message.messageId}
                        className="w-full"
                        style={
                            isNew
                                ? {
                                    animation:
                                        'message-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                                    // stagger first load; cap so it doesn't feel sluggish
                                    animationDelay: `${Math.min(idx * 25, 100)}ms`,
                                    opacity: 0,
                                    willChange: 'opacity, transform',
                                }
                                : undefined
                        }
                    >
                        {/* thought process (assistant only) */}
                        {!isUser && message.reasoning && (
                            <ThoughtProcess
                                key={`tp-${message.messageId}`}
                                thoughts={message.reasoning}
                            />
                        )}

                        <div className={cn('flex', isUser ? 'group justify-end items-end flex-col' : 'justify-start')}>
                            <div className={cn(
                                'py-2 px-3',
                                isUser ? 'bg-muted rounded-lg lg:max-w-[60%]' : 'max-w-full',
                            )}>
                                <ResponseMaker content={message.content} />
                                {message.imageUrls && message.imageUrls.length > 0 && (
                                    <ImageViewerProvider>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {message.imageUrls.map((url, i) => (
                                                <ImageViewer key={`msg-img-${i}`} url={url as string}>
                                                    <img
                                                        src={url}
                                                        alt=""
                                                        className="h-20 w-20 rounded object-cover border border-muted cursor-pointer"
                                                        onError={() => handleImageError(url)}
                                                    />
                                                </ImageViewer>
                                            ))}
                                        </div>
                                    </ImageViewerProvider>
                                )}

                                {/* copy — assistant row (always visible) */}
                                {!isUser && (
                                    <div className="flex flex-row gap-4 mt-2 px-1">
                                        <CopyButton
                                            isCopied={isCopied}
                                            onCopy={() =>
                                                handleCopy(
                                                    message.content,
                                                    message.messageId,
                                                )
                                            }
                                        />
                                        <MessageRating
                                            threadId={message.threadId}
                                            messageId={message.messageId}
                                            rate={message.rate}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* copy — user row (hover-reveal on desktop) */}
                            {isUser && message.content && (
                                <div className="group-hover:opacity-100 lg:opacity-0 transition-opacity duration-200 flex flex-row gap-4 mt-2 px-1">
                                    <CopyButton
                                        isCopied={isCopied}
                                        onCopy={() =>
                                            handleCopy(
                                                message.content,
                                                message.messageId,
                                            )
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
}

// ── reusable copy button with cross-fade icons ────────────────────────────────
function CopyButton({
    isCopied,
    onCopy,
}: {
    isCopied: boolean;
    onCopy: () => void;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onCopy}
                    aria-label={isCopied ? 'Copied' : 'Copy'}
                    className="relative size-4 transition-transform duration-150 active:scale-90"
                >
                    <CopyIcon
                        className={cn(
                            'absolute inset-0 size-4 text-foreground transition-all duration-200',
                            isCopied
                                ? 'opacity-0 scale-50'
                                : 'opacity-100 scale-100',
                        )}
                    />
                    <CheckIcon
                        className={cn(
                            'absolute inset-0 size-4 text-success transition-all duration-200',
                            isCopied
                                ? 'opacity-100 scale-100'
                                : 'opacity-0 scale-50',
                        )}
                    />
                </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                {isCopied ? 'Copied!' : 'Copy'}
            </TooltipContent>
        </Tooltip>
    );
}
