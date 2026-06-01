'use client'

import { Button } from "@/components/ui/button"
import { Trash2, Edit, Box, MessageSquare, SendHorizontalIcon, Layers2 } from "lucide-react"
import { useChat } from "@/hooks/use-chat"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import ImageViewer, { ImageViewerProvider } from "@/components/ui/image-viewer"
import { useRouter } from "next/navigation"
import { errorToast, successToast } from "@/components/ui/sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useDraft } from "@/hooks/use-draft"
import { DraftEntry } from "@/utils/draft-mechanism"
import { TooltipIconButton } from "@/components/core/TooltipIconButton"
import useImageError from "@/hooks/use-image-error"

// ─── Key format: `location:${locationId}thread:${threadId}`
//                `location:${locationId}asset:${assetId}`
function parseDraftKey(draftId: string): { type: 'thread' | 'asset'; id: string } | null {
    const threadIdx = draftId.lastIndexOf('thread:');
    const assetIdx = draftId.lastIndexOf('asset:');

    if (threadIdx !== -1 && threadIdx > assetIdx) {
        return { type: 'thread', id: draftId.slice(threadIdx + 'thread:'.length) };
    }
    if (assetIdx !== -1) {
        return { type: 'asset', id: draftId.slice(assetIdx + 'asset:'.length) };
    }
    return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function DeleteConfirmation({ title, onDelete }: { title: string; onDelete: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <TooltipIconButton variant="destructive" tooltip="Delete Draft" className="size-9">
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

function SendConfirmation({ title, disabled, onSend }: { title: string; disabled: boolean; onSend: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <TooltipIconButton variant="default" disabled={disabled} tooltip="Send Message" className="size-9">
                    <SendHorizontalIcon />
                </TooltipIconButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogTitle>Send message</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to send message from the draft for <b>{title}</b>?
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function DraftPage() {
    const { handleImageError } = useImageError();
    const { postMessageAsync } = useChat();
    const { drafts, draftCount, clearThreadDraft, clearAssetDraft, clearAllDrafts } = useDraft();
    const router = useRouter();

    const handleClearAll = () => {
        clearAllDrafts();
        successToast({
            title: "Drafts deleted",
            description: "All the drafts have been deleted successfully.",
        });
    };

    const handleDeleteDraft = (draftId: string, showToast = true, deleteAttachment = true) => {
        const parsed = parseDraftKey(draftId);
        if (!parsed) return;

        if (parsed.type === 'thread') {
            clearThreadDraft(parsed.id, deleteAttachment);
        } else {
            clearAssetDraft(parsed.id, deleteAttachment);
        }

        if (showToast) {
            successToast({
                title: "Draft deleted",
                description: "The draft has been deleted successfully.",
            });
        }
    };

    const handleEditDraft = (draftId: string) => {
        const parsed = parseDraftKey(draftId);
        if (!parsed) return;

        if (parsed.type === 'thread') {
            router.push(`/thread?id=${parsed.id}`);
        } else {
            router.push(`/asset?id=${parsed.id}`);
        }
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
        } catch {
            errorToast({
                title: "Error",
                description: "Failed to send the draft. Please try again.",
            });
        }
    };

    const draftEntries = Object.entries(drafts);
    const hasDrafts = draftEntries.length > 0;

    return (
        <div className="flex flex-col gap-4 pb-5">
            <div className="flex flex-row justify-between items-center">
                <div className="flex flex-col gap-1">
                    <h1 className="page-header">Drafts</h1>
                    <span className="page-subTitle ml-0.5">Manage your messaging drafts</span>
                </div>
                {draftCount > 0 && <ClearAllConfirmation onDelete={handleClearAll} />}
            </div>

            {hasDrafts ? (
                <div className="flex flex-col gap-5">
                    {draftEntries.map(([draftId, entry]) => {
                        const parsed = parseDraftKey(draftId);
                        if (!parsed) return null;
                        const { type, id } = parsed;

                        return (
                            <Card key={`${id}-${type}`} className="p-5 gap-5">
                                <CardHeader className="p-0 lg:flex lg:flex-row lg:items-center lg:justify-between">
                                    <div className="lg:w-full flex items-center gap-2">
                                        <div className="bg-muted/50 p-2.5 rounded-full">
                                            {type === 'thread'
                                                ? <MessageSquare className="size-5" />
                                                : <Box className="size-5" />
                                            }
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm">{entry.title}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {type === 'thread' ? 'Thread' : 'Asset'} Draft
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="lg:flex gap-2 w-full justify-end hidden">
                                        <TooltipIconButton
                                            variant="secondary"
                                            onClick={() => handleEditDraft(draftId)}
                                            tooltip="Edit draft"
                                            className="size-9"
                                        >
                                            <Edit />
                                        </TooltipIconButton>
                                        <SendConfirmation
                                            title={entry.title}
                                            onSend={() => handleSendDraft(draftId, entry)}
                                            disabled={!entry.text.trim() && entry.attachmentUrls.length === 0}
                                        />
                                        <DeleteConfirmation
                                            title={entry.title}
                                            onDelete={() => handleDeleteDraft(draftId)}
                                        />
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0 flex flex-col gap-3">
                                    <p className="text-sm line-clamp-4">{entry.text}</p>
                                    {entry.attachmentUrls?.length > 0 && (
                                        <ImageViewerProvider>
                                            <div className="flex gap-2">
                                                {entry.attachmentUrls.slice(0, 3).map((url, index) => (
                                                    <div key={index} className="size-15 cursor-pointer">
                                                        <ImageViewer url={url}>
                                                            <img
                                                                src={url}
                                                                alt={`Attachment ${index + 1}`}
                                                                className="h-full w-full object-cover"
                                                                onError={() => handleImageError(url)}
                                                            />
                                                        </ImageViewer>
                                                    </div>
                                                ))}
                                                {entry.attachmentUrls.length > 3 && (
                                                    <div className="size-15 rounded bg-muted flex items-center justify-center text-sm font-medium">
                                                        +{entry.attachmentUrls.length - 3}
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
                                            onClick={() => handleEditDraft(draftId)}
                                            tooltip="Edit draft"
                                            className="size-9"
                                        >
                                            <Edit />
                                        </TooltipIconButton>
                                        <SendConfirmation
                                            title={entry.title}
                                            onSend={() => handleSendDraft(draftId, entry)}
                                            disabled={!entry.text.trim() && entry.attachmentUrls.length === 0}
                                        />
                                        <DeleteConfirmation
                                            title={entry.title}
                                            onDelete={() => handleDeleteDraft(draftId)}
                                        />
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-3 mt-20">
                    <Layers2 className="size-15" strokeWidth={1.2} />
                    <div className="text-center">
                        <h3 className="text-lg font-medium">No drafts found</h3>
                        <p className="text-muted-foreground">
                            You don't have any saved drafts yet.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}