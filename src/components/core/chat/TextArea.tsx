'use client';

import { useAsset } from '@/hooks/use-asset';
import { isIOSDevice, useCameraCapture } from '@/hooks/use-camera-capture';
import { useChat } from '@/hooks/use-chat';
import { useDraft } from '@/hooks/use-draft';
import useImageError from '@/hooks/use-image-error';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { useThread } from '@/hooks/use-thread';
import messagingService from '@/services/api/messagingService';
import { ThreadAction } from '@/types/equipment/thread';
import {
    Camera,
    GalleryHorizontal,
    ImagePlus,
    Loader2Icon,
    MicIcon,
    SendHorizontalIcon,
    SquarePen,
    X,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ImageViewer, { ImageViewerProvider } from '@/components/ui/image-viewer';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { errorToast, successToast } from '@/components/ui/sonner';

import { cn } from '@/lib/utils';

import { TooltipIconButton } from '../TooltipIconButton';
import ActionPopover from '../work-order/ActionPopover';
import { WebcamModal } from './CameraCapture';

const MAX_HEIGHT_LINES = 10;
const MAX_ATTACHMENT_IMAGES = 3;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const DRAFT_DEBOUNCE_MS = 400;

// ── AttachPopover ─────────────────────────────────────────────────────────────
// Behaviour differs per platform:
//
//  iOS     → single plain button, no popover.
//            iOS Safari intercepts ANY file input click at the OS level and
//            shows its own native sheet ("Photo Library / Take Photo / Choose
//            Files") regardless of the `capture` attribute. We can't suppress
//            or customise that sheet, so we skip the popover entirely and let
//            iOS provide both options natively via the plain gallery input.
//
//  Android → popover with Gallery + Camera.
//            Chrome on Android respects capture="environment" so each option
//            routes correctly: gallery → photo picker, camera → camera app.
//
//  Desktop → popover with Gallery + Camera.
//            Camera opens the WebcamModal (getUserMedia).
function AttachPopover({
    disabled,
    onGallery,
    onCamera,
}: {
    disabled?: boolean;
    onGallery: () => void;
    onCamera: () => void;
}) {
    const [open, setOpen] = useState(false);
    const isIOS = isIOSDevice();

    function pick(action: () => void) {
        setOpen(false);
        // Small delay so the popover fully closes before the picker/modal opens.
        // Some mobile browsers swallow the .click() if called synchronously.
        setTimeout(action, 50);
    }

    // iOS: plain button — the OS sheet handles both gallery and camera for us
    if (isIOS) {
        return (
            <TooltipIconButton
                tooltip="Attach image"
                variant="ghost"
                className="size-8 transition-opacity ease-in"
                disabled={disabled}
                onClick={onGallery}
            >
                <ImagePlus strokeWidth={1.6} className="size-5" />
            </TooltipIconButton>
        );
    }

    // Android + Desktop: two-option popover
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <span>
                    <TooltipIconButton
                        tooltip="Attach image"
                        variant="ghost"
                        className="size-8 transition-opacity ease-in"
                        disabled={disabled}
                    >
                        <ImagePlus strokeWidth={1.6} className="size-5" />
                    </TooltipIconButton>
                </span>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-40 p-1">
                <button
                    type="button"
                    onClick={() => pick(onGallery)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                    <GalleryHorizontal className="size-4 shrink-0" />
                    Gallery
                </button>
                <button
                    type="button"
                    onClick={() => pick(onCamera)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                    <Camera className="size-4 shrink-0" />
                    Camera
                </button>
            </PopoverContent>
        </Popover>
    );
}

export default function TextArea({
    assetTitle,
    isBento = true,
}: {
    assetTitle?: string | null;
    isBento?: boolean;
}) {
    const { currentAssetId, currentAsset } = useAsset();
    const {
        currentThreadId,
        currentThread,
        isThreadProcessing,
        closeThread,
        reportThread,
    } = useThread();
    const { postMessageAsync, sse, removeProcessedThread, messages } =
        useChat();
    const {
        clearThreadDraft,
        clearAssetDraft,
        saveThreadDraft,
        saveAssetDraft,
        getAssetDraft,
        getThreadDraft,
    } = useDraft();
    const { handleImageError } = useImageError();
    const pathname = usePathname();

    const hasAttachments = useMemo(
        () => messages.some((m) => m.imageUrls && m.imageUrls.length > 0),
        [messages],
    );

    const inputRef = useRef<HTMLInputElement>(null);
    const mirrorRef = useRef<HTMLSpanElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const [overflow, setOverflow] = useState(false);
    const [value, setValue] = useState('');
    const [pendingAttachmentUrls, setPendingAttachmentUrls] = useState<
        string[]
    >([]);
    const [uploadingCount, setUploadingCount] = useState(0);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // useCameraCapture handles: Android hidden input, desktop webcam modal,
    // and the branch logic between them — all in one place.
    const {
        cameraInputRef,
        webcamOpen,
        closeWebcam,
        handleCameraClick,
        handleWebcamCapture,
    } = useCameraCapture({
        onCapture: (file) => handleWebcamFile(file),
    });
    const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const valueRef = useRef(value);
    const attachmentUrlsRef = useRef(pendingAttachmentUrls);

    // ── isDirty ──────────────────────────────────────────────────────────────
    // Tracks whether the current field content came from the USER (true) or
    // from a programmatic restore / post-send clear (false).
    //
    // Draft writes (debounced save + flush on unmount) are GATED behind this
    // flag, so simply switching pages never overwrites or resurrects a draft.
    //
    // Set to true  → user types, attaches, removes an image, or dictates
    // Set to false → restore effect runs, or sendMessage() clears the field
    const isDirtyRef = useRef(false);

    const {
        isListening,
        transcript,
        isSupported,
        error,
        startListening,
        stopListening,
        resetTranscript,
    } = useSpeechToText();

    const canSend =
        value.trim().length > 0 && uploadingCount === 0 && !sse.isPosting;

    // ── uploadFiles ──────────────────────────────────────────────────────────
    // Shared validation + upload pipeline used by file input, drag-and-drop,
    // and webcam capture.
    const uploadFiles = useCallback(
        (files: File[]) => {
            const valid: File[] = [];
            for (const file of files) {
                if (!file.type.startsWith('image/')) {
                    errorToast({
                        title: 'Invalid file',
                        description: `${file.name} is not an image`,
                    });
                    continue;
                }
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    errorToast({
                        title: 'File too large',
                        description: `${file.name} must be under 5MB`,
                    });
                    continue;
                }
                valid.push(file);
            }
            const currentLen = pendingAttachmentUrls.length;
            const toUpload = valid.slice(0, MAX_ATTACHMENT_IMAGES - currentLen);
            if (currentLen + valid.length > MAX_ATTACHMENT_IMAGES) {
                errorToast({
                    title: 'Limit Reached',
                    description: `Max ${MAX_ATTACHMENT_IMAGES} images are allowed`,
                });
            }
            if (toUpload.length > 0) {
                isDirtyRef.current = true;
                setUploadingCount((c) => c + toUpload.length);
                messagingService
                    .uploadAttachments(toUpload, currentAssetId ?? '')
                    .then(({ urls }) => {
                        setPendingAttachmentUrls((prev) =>
                            [...prev, ...urls].slice(0, MAX_ATTACHMENT_IMAGES),
                        );
                    })
                    .catch((err) => {
                        errorToast({
                            title: 'Upload failed',
                            description:
                                err instanceof Error
                                    ? err.message
                                    : 'Failed to upload images',
                        });
                    })
                    .finally(() =>
                        setUploadingCount((c) => c - toUpload.length),
                    );
            }
        },
        [pendingAttachmentUrls, currentAssetId],
    );

    // ── Debounced save ───────────────────────────────────────────────────────
    // Only runs when isDirty — guards against the restore effect triggering a
    // save the moment the component switches context.
    const saveDraftDebounced = useCallback(
        (text: string, attachmentUrls: string[]) => {
            if (!currentThreadId && !currentAssetId) return;
            if (!isDirtyRef.current) return;

            if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
            draftTimeoutRef.current = setTimeout(() => {
                const isEmpty = !text.trim() && attachmentUrls.length === 0;
                if (isEmpty) {
                    if (currentThreadId)
                        clearThreadDraft(currentThreadId, true);
                    else if (currentAssetId)
                        clearAssetDraft(currentAssetId, true);
                } else {
                    if (currentThreadId)
                        saveThreadDraft(currentThreadId, {
                            text,
                            assetId: currentAssetId ?? '',
                            title: currentThread?.title ?? '',
                            attachmentUrls,
                        });
                    else if (currentAssetId)
                        saveAssetDraft(currentAssetId, {
                            text,
                            title: currentAsset?.name ?? '',
                            attachmentUrls,
                        });
                }
                draftTimeoutRef.current = null;
            }, DRAFT_DEBOUNCE_MS);
        },
        [currentThreadId, currentAssetId, currentThread, currentAsset],
    );

    function handleTextareaResize() {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        const lineHeight = parseInt(
            getComputedStyle(textarea).lineHeight || '20',
            10,
        );
        const maxHeight = lineHeight * MAX_HEIGHT_LINES;
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
        textarea.style.overflowY =
            textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }

    function checkOverflow() {
        if (overflow) return;
        if (!inputRef.current || !mirrorRef.current || !textareaRef.current)
            return;
        mirrorRef.current.textContent = inputRef.current.value || ' ';
        setOverflow(
            mirrorRef.current.scrollWidth > inputRef.current.clientWidth,
        );
    }

    async function sendMessage() {
        if (!canSend) return;
        stopListening();

        const trimmedValue = value.trim();
        const tid = currentThreadId ?? '';
        const assetId = currentAssetId ?? null;
        setValue('');

        if (pendingAttachmentUrls.length > 0) {
            postMessageAsync(
                trimmedValue,
                assetId,
                tid,
                false,
                currentThread?.title ?? '',
                undefined,
                'user',
                pendingAttachmentUrls,
            );
        } else {
            postMessageAsync(
                trimmedValue,
                assetId,
                tid,
                false,
                currentThread?.title ?? '',
            );
        }

        isDirtyRef.current = false;

        setPendingAttachmentUrls([]);
        setUploadingCount(0);

        if (tid) clearThreadDraft(tid);
        else if (assetId) clearAssetDraft(assetId);
    }

    function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        e.target.value = '';
        uploadFiles(files);
    }

    async function removeAttachment(index: number) {
        const url = pendingAttachmentUrls[index];
        if (!url) return;
        isDirtyRef.current = true;
        setPendingAttachmentUrls((prev) => prev.filter((_, i) => i !== index));
        try {
            await messagingService.deleteAttachment(url);
        } catch (err) {
            setPendingAttachmentUrls((prev) => {
                const l = [...prev];
                l.splice(index, 0, url);
                return l;
            });
            errorToast({
                title: 'Failed to delete',
                description:
                    err instanceof Error
                        ? err.message
                        : 'Failed to delete attachment',
            });
        }
    }

    // ── handleWebcamFile ─────────────────────────────────────────────────────
    // Called by useCameraCapture when the user captures a photo (desktop modal
    // or Android native camera). Feeds the File into the normal upload pipeline.
    function handleWebcamFile(file: File) {
        if (pendingAttachmentUrls.length >= MAX_ATTACHMENT_IMAGES) {
            errorToast({
                title: 'Limit Reached',
                description: `Max ${MAX_ATTACHMENT_IMAGES} images are allowed`,
            });
            return;
        }
        isDirtyRef.current = true;
        setUploadingCount((c) => c + 1);
        messagingService
            .uploadAttachments([file], currentAssetId ?? '')
            .then(({ urls }) => {
                setPendingAttachmentUrls((prev) =>
                    [...prev, ...urls].slice(0, MAX_ATTACHMENT_IMAGES),
                );
            })
            .catch((err) => {
                errorToast({
                    title: 'Upload failed',
                    description:
                        err instanceof Error
                            ? err.message
                            : 'Failed to upload image',
                });
            })
            .finally(() => setUploadingCount((c) => c - 1));
    }

    function handleKeyDown(
        e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
    ) {
        if (e.key === 'Enter' && e.shiftKey && value != '') {
            e.preventDefault();
            setOverflow(true);
            setValue((v) => v + '\n');
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    async function action(
        action: ThreadAction,
        threadTitle: string,
        threadId: string,
    ) {
        let result = false;
        if (action === 'close') result = await closeThread(threadId);
        if (action === 'report') result = await reportThread(threadId);
        if (result) {
            removeProcessedThread(threadId);
            successToast({
                title: 'Success',
                description: `${threadTitle} has been ${action === 'close' ? 'closed' : 'reported'}.`,
            });
        }
    }

    function toggleMicrophone() {
        if (isListening) {
            stopListening();
        } else {
            resetTranscript();
            startListening();
        }
    }

    // ── Drag and drop handlers ───────────────────────────────────────────────
    function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        if (block || isThreadProcessing(currentThreadId ?? '')) return;
        if (pendingAttachmentUrls.length >= MAX_ATTACHMENT_IMAGES) return;
        // Only show drop target if there are actual image files being dragged
        const hasImages = Array.from(e.dataTransfer.items).some(
            (item) => item.kind === 'file' && item.type.startsWith('image/'),
        );
        if (hasImages) setIsDragOver(true);
    }

    function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        // Only clear when leaving the drop zone entirely (not a child element)
        if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (block || isThreadProcessing(currentThreadId ?? '')) return;
        const files = Array.from(e.dataTransfer.files).filter((f) =>
            f.type.startsWith('image/'),
        );
        if (files.length > 0) uploadFiles(files);
    }
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        valueRef.current = value;
    }, [value]);
    useEffect(() => {
        attachmentUrlsRef.current = pendingAttachmentUrls;
    }, [pendingAttachmentUrls]);

    useEffect(() => {
        if (!currentThreadId && !currentAssetId) {
            if (draftTimeoutRef.current) {
                clearTimeout(draftTimeoutRef.current);
                draftTimeoutRef.current = null;
            }
            return;
        }
        saveDraftDebounced(value, pendingAttachmentUrls);
    }, [
        value,
        pendingAttachmentUrls,
        saveDraftDebounced,
        currentThreadId,
        currentAssetId,
    ]);

    useEffect(() => {
        if (transcript) {
            isDirtyRef.current = true;
            setValue((prev: string) => prev + transcript);
            resetTranscript();
        }
    }, [transcript, resetTranscript]);

    useEffect(() => {
        if (error)
            errorToast({
                title: 'Speech Recognition Error',
                description: error,
            });
    }, [error]);

    useEffect(() => {
        if (!overflow) inputRef.current?.focus();
        else textareaRef.current?.focus();
    }, [overflow]);

    useEffect(() => {
        if (value === '' || value === null) {
            setOverflow(false);
            if (mirrorRef?.current) mirrorRef.current.textContent = ' ';
        }
        checkOverflow();
        requestAnimationFrame(() => handleTextareaResize());
    }, [value]);

    useEffect(() => {
        return () => {
            if (draftTimeoutRef.current) {
                clearTimeout(draftTimeoutRef.current);
                draftTimeoutRef.current = null;
            }
            if (!isDirtyRef.current) return;
            const hasContent =
                valueRef.current || attachmentUrlsRef.current.length > 0;
            if (!hasContent) return;
            if (currentThreadId) {
                saveThreadDraft(currentThreadId, {
                    text: valueRef.current,
                    assetId: currentAssetId ?? '',
                    title: currentThread?.title ?? '',
                    attachmentUrls: attachmentUrlsRef.current,
                });
            } else if (currentAssetId) {
                saveAssetDraft(currentAssetId, {
                    text: valueRef.current,
                    title: currentAsset?.name ?? '',
                    attachmentUrls: attachmentUrlsRef.current,
                });
            }
        };
    }, [currentThreadId, currentAssetId, currentThread, currentAsset]);

    useEffect(() => {
        if (!currentThreadId && !currentAssetId) {
            setValue('');
            setPendingAttachmentUrls([]);
            setOverflow(false);
            return;
        }
        const draft =
            getThreadDraft(currentThreadId ?? '') ??
            (pathname.includes('asset')
                ? getAssetDraft(currentAssetId ?? '')
                : null);
        isDirtyRef.current = false;
        if (draft) {
            setValue(draft.text || '');
            setPendingAttachmentUrls(draft.attachmentUrls || []);
        } else {
            setValue('');
            setPendingAttachmentUrls([]);
            setOverflow(false);
        }
    }, [currentThreadId, currentAssetId]);

    const block = currentThread && currentThread?.status !== 'open';

    return (
        <div
            ref={dropZoneRef}
            aria-disabled={block || isThreadProcessing(currentThreadId ?? '')}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                'overflow-hidden focus-within:border-primary hover:border-primary w-full py-3 px-1.5 transition-colors ease-in relative',
                block ||
                    (isThreadProcessing(currentThreadId ?? '') &&
                        'pointer-events-none opacity-60 select-none !cursor-crosshair'),
                isBento ? 'bento' : 'rounded-md border border-muted bg-card',
                isDragOver && 'border-primary ring-2 ring-primary/20',
            )}
        >
            {/* Drag-over overlay */}
            {isDragOver && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-primary/5 border-2 border-dashed border-primary pointer-events-none">
                    <ImagePlus
                        className="size-7 text-primary"
                        strokeWidth={1.5}
                    />
                    <p className="text-sm font-medium text-primary">
                        Drop image to attach
                    </p>
                </div>
            )}

            {(pendingAttachmentUrls.length > 0 || uploadingCount > 0) && (
                <ImageViewerProvider>
                    <div className="flex flex-wrap gap-2 px-1.5 pb-2">
                        {pendingAttachmentUrls.map((url, i) => (
                            <div key={`url-${i}`} className="relative group">
                                <ImageViewer url={url as string}>
                                    <img
                                        src={url}
                                        alt=""
                                        className="h-14 w-14 rounded object-cover border border-muted"
                                        onError={() => handleImageError(url)}
                                    />
                                </ImageViewer>
                                <button
                                    type="button"
                                    aria-label="Remove image"
                                    onClick={() => removeAttachment(i)}
                                    disabled={block || uploadingCount > 0}
                                    className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-90 hover:opacity-100 disabled:opacity-50"
                                >
                                    <X className="size-3" />
                                </button>
                            </div>
                        ))}
                        {uploadingCount > 0 &&
                            Array.from({ length: uploadingCount }, (_, i) => (
                                <div
                                    key={`uploading-${i}`}
                                    className="h-14 w-14 rounded border border-muted bg-muted flex items-center justify-center"
                                >
                                    <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
                                </div>
                            ))}
                    </div>
                </ImageViewerProvider>
            )}
            <div
                className={cn(
                    'flex flex-row items-center',
                    overflow && 'flex-col',
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onFileInputChange}
                />
                {/* Camera input — capture="environment" used on Android only */}
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={onFileInputChange}
                />
                {!overflow &&
                    currentThread &&
                    currentThread?.status === 'open' &&
                    (isThreadProcessing(currentThread?.threadId ?? '') ? (
                        <Loader2Icon className="size-5 animate-spin" />
                    ) : (
                        <ActionPopover
                            action={action}
                            threadId={currentThread?.threadId ?? ''}
                            threadTitle={currentThread?.title ?? ''}
                            align="start"
                            hasAttachments={hasAttachments}
                            startedFromWorkOrder={
                                currentThread?.startedFromWorkOrder
                            }
                        >
                            <TooltipIconButton
                                tooltip="Action"
                                variant="ghost"
                                className="size-8 transition-opacity ease-in"
                                disabled={
                                    sse.isPosting ||
                                    block ||
                                    isThreadProcessing(currentThreadId ?? '')
                                }
                            >
                                <SquarePen />
                            </TooltipIconButton>
                        </ActionPopover>
                    ))}

                <div
                    className={cn(
                        'w-full relative',
                        overflow ? 'textarea-slide-up' : 'textarea-slide-down',
                    )}
                >
                    <input
                        ref={inputRef}
                        spellCheck
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        id="input-msg"
                        type="text"
                        value={value}
                        onChange={(e) => {
                            isDirtyRef.current = true;
                            setValue(e.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            assetTitle
                                ? `Ask anything about "${assetTitle}"`
                                : 'Ask anything...'
                        }
                        className={cn(
                            'w-full p-1.5 placeholder:text-muted-foreground resize-none border-none bg-transparent text-sm outline-none focus:ring-0 disabled:cursor-not-allowed',
                            overflow && value != '' ? ' hidden' : 'block',
                        )}
                    />
                    <span
                        ref={mirrorRef}
                        className="absolute top-0 left-0 whitespace-pre wrap-anywhere invisible p-1.5 text-sm"
                    />
                    <textarea
                        spellCheck
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        id="textarea-msg"
                        ref={textareaRef}
                        value={value}
                        rows={1}
                        onChange={(e) => {
                            isDirtyRef.current = true;
                            setValue(e.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={
                            block || isThreadProcessing(currentThreadId ?? '')
                        }
                        placeholder={
                            assetTitle
                                ? `Ask anything about "${assetTitle}"`
                                : 'Ask anything...'
                        }
                        className={cn(
                            'w-full p-1.5 placeholder:text-muted-foreground resize-none border-none bg-transparent text-sm outline-none focus:ring-0 disabled:cursor-not-allowed',
                            overflow && value != '' ? 'block' : 'hidden',
                        )}
                    />
                </div>

                <div
                    className={cn(
                        'flex flex-row items-center justify-end gap-1',
                        overflow ? 'w-full' : '',
                    )}
                >
                    {overflow &&
                        currentThread &&
                        currentThread?.status === 'open' &&
                        (isThreadProcessing(currentThread?.threadId ?? '') ? (
                            <Loader2Icon className="size-5 animate-spin" />
                        ) : (
                            <ActionPopover
                                action={action}
                                threadId={currentThread?.threadId ?? ''}
                                threadTitle={currentThread?.title ?? ''}
                                align="start"
                                hasAttachments={hasAttachments}
                                startedFromWorkOrder={
                                    currentThread?.startedFromWorkOrder
                                }
                            >
                                <TooltipIconButton
                                    tooltip="Action"
                                    variant="ghost"
                                    className="size-8 transition-opacity ease-in -mr-2"
                                    disabled={
                                        !canSend ||
                                        block ||
                                        isThreadProcessing(
                                            currentThreadId ?? '',
                                        )
                                    }
                                >
                                    <SquarePen />
                                </TooltipIconButton>
                            </ActionPopover>
                        ))}

                    {isSupported && (
                        <TooltipIconButton
                            tooltip={
                                isListening
                                    ? 'Recording... Press to stop'
                                    : 'Press to record'
                            }
                            variant={isListening ? 'destructive' : 'ghost'}
                            className={cn(
                                'size-8 transition-all ease-in',
                                isListening && 'animate-pulse',
                            )}
                            onClick={toggleMicrophone}
                        >
                            <MicIcon />
                            {isListening && (
                                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-destructive animate-ping" />
                            )}
                        </TooltipIconButton>
                    )}

                    {currentThread && currentThread.status !== 'open' ? null : (
                        <AttachPopover
                            disabled={
                                block ||
                                isThreadProcessing(currentThreadId ?? '') ||
                                pendingAttachmentUrls.length >=
                                    MAX_ATTACHMENT_IMAGES
                            }
                            onGallery={() => fileInputRef.current?.click()}
                            onCamera={handleCameraClick}
                        />
                    )}

                    <TooltipIconButton
                        tooltip="Send"
                        variant="default"
                        className="size-8 transition-opacity ease-in"
                        onClick={sendMessage}
                        disabled={
                            !canSend ||
                            block ||
                            isThreadProcessing(currentThreadId ?? '')
                        }
                    >
                        <SendHorizontalIcon />
                    </TooltipIconButton>
                </div>
            </div>

            {/* Desktop webcam capture modal */}
            <WebcamModal
                open={webcamOpen}
                onClose={closeWebcam}
                onCapture={handleWebcamCapture}
            />
        </div>
    );
}
