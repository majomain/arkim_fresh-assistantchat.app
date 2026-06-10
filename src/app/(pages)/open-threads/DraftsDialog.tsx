'use client';

import { useChat } from '@/hooks/use-chat';
import { useDraft } from '@/hooks/use-draft';
import useImageError from '@/hooks/use-image-error';
import {
    Box,
    Edit,
    Layers2,
    MessageSquare,
    SendHorizontalIcon,
    Trash2,
    X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TooltipIconButton } from '@/components/core/TooltipIconButton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import ImageViewer, { ImageViewerProvider } from '@/components/ui/image-viewer';
import { errorToast, successToast } from '@/components/ui/sonner';

import { DraftEntry } from '@/utils/draft-mechanism';

import { cn } from '@/lib/utils';

function parseDraftKey(
    draftId: string,
): { type: 'thread' | 'asset'; id: string } | null {
    const threadIdx = draftId.lastIndexOf('thread:');
    const assetIdx = draftId.lastIndexOf('asset:');
    if (threadIdx !== -1 && threadIdx > assetIdx) {
        return {
            type: 'thread',
            id: draftId.slice(threadIdx + 'thread:'.length),
        };
    }
    if (assetIdx !== -1) {
        return { type: 'asset', id: draftId.slice(assetIdx + 'asset:'.length) };
    }
    return null;
}

function ClearAllConfirmation({ onDelete }: { onDelete: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline">Clear All</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogTitle>Clear all drafts</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to delete all the drafts?
                </AlertDialogDescription>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild onClick={onDelete}>
                        <Button variant="destructive">Clear</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function DeleteConfirmation({
    title,
    onDelete,
}: {
    title: string;
    onDelete: () => void;
}) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <TooltipIconButton
                    variant="destructive"
                    tooltip="Delete Draft"
                    className="size-9"
                >
                    <Trash2 />
                </TooltipIconButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogTitle>Delete draft</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to delete draft for <b>{title}</b>?
                </AlertDialogDescription>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild onClick={onDelete}>
                        <Button variant="destructive">Delete</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function SendConfirmation({
    title,
    disabled,
    onSend,
}: {
    title: string;
    disabled: boolean;
    onSend: () => void;
}) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <TooltipIconButton
                    variant="default"
                    disabled={disabled}
                    tooltip="Send Message"
                    className="size-9"
                >
                    <SendHorizontalIcon />
                </TooltipIconButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogTitle>Send message</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to send message from the draft for{' '}
                    <b>{title}</b>?
                </AlertDialogDescription>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild onClick={onSend}>
                        <Button variant="default">Send</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default function DraftsDialog() {
    const { handleImageError } = useImageError();
    const { postMessageAsync } = useChat();
    const {
        drafts,
        draftCount,
        clearThreadDraft,
        clearAssetDraft,
        clearAllDrafts,
    } = useDraft();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    // Close on Escape — only when the panel itself is open
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open]);

    const handleClearAll = () => {
        clearAllDrafts();
        successToast({
            title: 'Drafts deleted',
            description: 'All the drafts have been deleted successfully.',
        });
    };

    const handleDeleteDraft = (
        draftId: string,
        showToast = true,
        deleteAttachment = true,
    ) => {
        const parsed = parseDraftKey(draftId);
        if (!parsed) return;
        parsed.type === 'thread'
            ? clearThreadDraft(parsed.id, deleteAttachment)
            : clearAssetDraft(parsed.id, deleteAttachment);
        if (showToast)
            successToast({
                title: 'Draft deleted',
                description: 'The draft has been deleted successfully.',
            });
    };

    const handleEditDraft = (draftId: string) => {
        const parsed = parseDraftKey(draftId);
        if (!parsed) return;
        setOpen(false);
        router.push(
            parsed.type === 'thread'
                ? `/thread?id=${parsed.id}`
                : `/asset?id=${parsed.id}`,
        );
    };

    const handleSendDraft = (draftId: string, entry: DraftEntry) => {
        const parsed = parseDraftKey(draftId);
        if (!parsed) return;
        try {
            if (parsed.type === 'thread') {
                postMessageAsync(
                    entry.text,
                    entry.assetId ?? '',
                    parsed.id,
                    false,
                    entry.title,
                    undefined,
                    'user',
                    entry.attachmentUrls,
                );
                router.push(`/thread?id=${parsed.id}`);
            } else {
                postMessageAsync(
                    entry.text,
                    parsed.id,
                    '',
                    false,
                    '',
                    undefined,
                    'user',
                    entry.attachmentUrls,
                );
            }
            handleDeleteDraft(draftId, false, false);
            setOpen(false);
        } catch {
            errorToast({
                title: 'Error',
                description: 'Failed to send the draft. Please try again.',
            });
        }
    };

    const draftEntries = Object.entries(drafts);
    const hasDrafts = draftEntries.length > 0;

    return (
        <>
            {/* Trigger button */}
            <Button variant="outline" onClick={() => setOpen(true)}>
                <Layers2 />
                <p>Drafts</p>
                {draftCount > 0 && (
                    <span className="text-xs bg-sidebar-primary text-sidebar-primary-foreground px-1.5 py-0.5 rounded-full">
                        {draftCount}
                    </span>
                )}
            </Button>

            {/* Full-page overlay — plain DOM, no Radix, so the photo viewer
                has full pointer and keyboard ownership when open */}
            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-black/50"
                        onClick={() => setOpen(false)}
                    />

                    {/* Panel */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div
                            className={cn(
                                'pointer-events-auto relative flex flex-col w-full max-w-lg max-h-[90vh]',
                                'bg-background border rounded-lg shadow-lg',
                            )}
                            // Prevent backdrop click from firing when clicking inside
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                                <h2 className="text-lg font-semibold">
                                    Saved Drafts
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setOpen(false)}
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>

                            {/* Body */}
                            {hasDrafts ? (
                                <>
                                    <div className="flex flex-col gap-5 overflow-y-auto px-6 py-4">
                                        {draftEntries.map(
                                            ([draftId, entry]) => {
                                                const parsed =
                                                    parseDraftKey(draftId);
                                                if (!parsed) return null;
                                                const { type, id } = parsed;

                                                return (
                                                    <Card
                                                        key={`${id}-${type}`}
                                                        className="p-5 gap-5 !bg-transparent !shadow-none"
                                                    >
                                                        <CardHeader className="p-0 lg:flex lg:flex-row lg:items-center lg:justify-between">
                                                            <div className="lg:w-full flex items-center gap-2">
                                                                <div className="bg-muted/50 p-2.5 rounded-full">
                                                                    {type ===
                                                                    'thread' ? (
                                                                        <MessageSquare className="size-5" />
                                                                    ) : (
                                                                        <Box className="size-5" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <CardTitle className="text-sm">
                                                                        {
                                                                            entry.title
                                                                        }
                                                                    </CardTitle>
                                                                    <CardDescription className="text-xs">
                                                                        {type ===
                                                                        'thread'
                                                                            ? 'Thread'
                                                                            : 'Asset'}{' '}
                                                                        Draft
                                                                    </CardDescription>
                                                                </div>
                                                            </div>
                                                            <div className="lg:flex gap-2 w-full justify-end hidden">
                                                                <TooltipIconButton
                                                                    variant="secondary"
                                                                    onClick={() =>
                                                                        handleEditDraft(
                                                                            draftId,
                                                                        )
                                                                    }
                                                                    tooltip="Edit draft"
                                                                    className="size-9"
                                                                >
                                                                    <Edit />
                                                                </TooltipIconButton>
                                                                {entry.text && (
                                                                    <SendConfirmation
                                                                        title={
                                                                            entry.title
                                                                        }
                                                                        onSend={() =>
                                                                            handleSendDraft(
                                                                                draftId,
                                                                                entry,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !entry.text.trim() &&
                                                                            entry
                                                                                .attachmentUrls
                                                                                .length ===
                                                                                0
                                                                        }
                                                                    />
                                                                )}
                                                                <DeleteConfirmation
                                                                    title={
                                                                        entry.title
                                                                    }
                                                                    onDelete={() =>
                                                                        handleDeleteDraft(
                                                                            draftId,
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </CardHeader>

                                                        <CardContent className="p-0 flex flex-col gap-3">
                                                            <p className="text-sm line-clamp-4">
                                                                {entry.text}
                                                            </p>
                                                            {entry
                                                                .attachmentUrls
                                                                ?.length >
                                                                0 && (
                                                                <ImageViewerProvider>
                                                                    <div className="flex gap-2">
                                                                        {entry.attachmentUrls
                                                                            .slice(
                                                                                0,
                                                                                3,
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    url,
                                                                                    index,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                        className="size-15 cursor-pointer"
                                                                                    >
                                                                                        <ImageViewer
                                                                                            url={
                                                                                                url
                                                                                            }
                                                                                        >
                                                                                            <img
                                                                                                src={
                                                                                                    url
                                                                                                }
                                                                                                alt={`Attachment ${index + 1}`}
                                                                                                className="h-full w-full object-cover"
                                                                                                onError={() =>
                                                                                                    handleImageError(
                                                                                                        url,
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                        </ImageViewer>
                                                                                    </div>
                                                                                ),
                                                                            )}
                                                                        {entry
                                                                            .attachmentUrls
                                                                            .length >
                                                                            3 && (
                                                                            <div className="size-15 rounded bg-muted flex items-center justify-center text-sm font-medium">
                                                                                +
                                                                                {entry
                                                                                    .attachmentUrls
                                                                                    .length -
                                                                                    3}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </ImageViewerProvider>
                                                            )}
                                                        </CardContent>

                                                        <CardFooter className="lg:hidden p-0">
                                                            <div className="flex gap-2 w-full justify-end">
                                                                <TooltipIconButton
                                                                    variant="secondary"
                                                                    onClick={() =>
                                                                        handleEditDraft(
                                                                            draftId,
                                                                        )
                                                                    }
                                                                    tooltip="Edit draft"
                                                                    className="size-9"
                                                                >
                                                                    <Edit />
                                                                </TooltipIconButton>
                                                                {entry.text && (
                                                                    <SendConfirmation
                                                                        title={
                                                                            entry.title
                                                                        }
                                                                        onSend={() =>
                                                                            handleSendDraft(
                                                                                draftId,
                                                                                entry,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !entry.text.trim() &&
                                                                            entry
                                                                                .attachmentUrls
                                                                                .length ===
                                                                                0
                                                                        }
                                                                    />
                                                                )}
                                                                <DeleteConfirmation
                                                                    title={
                                                                        entry.title
                                                                    }
                                                                    onDelete={() =>
                                                                        handleDeleteDraft(
                                                                            draftId,
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </CardFooter>
                                                    </Card>
                                                );
                                            },
                                        )}
                                    </div>
                                    <div className="flex justify-end px-6 py-3 border-t shrink-0">
                                        <ClearAllConfirmation
                                            onDelete={handleClearAll}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 py-20">
                                    <Layers2
                                        className="size-15 text-muted-foreground"
                                        strokeWidth={1.2}
                                    />
                                    <div className="text-center">
                                        <h3 className="text-lg font-medium">
                                            No drafts found
                                        </h3>
                                        <p className="text-muted-foreground">
                                            You don't have any saved drafts yet.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
