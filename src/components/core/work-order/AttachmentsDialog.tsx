'use client';

import ImageViewer, { ImageViewerProvider } from "@/components/ui/image-viewer";
import useImageError from "@/hooks/use-image-error";
import { WorkOrderDetail } from "@/types/workOrder/workOrder";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function AttachmentsDialog({ workOrder, children, fullWidth = false }: { workOrder: WorkOrderDetail; children: React.ReactNode; fullWidth?: boolean }) {
    const [open, setOpen] = useState(false);
    const isPhotoViewerOpen = useRef(false);
    const { handleImageError } = useImageError();

    // Escape key handler — skipped when the photo viewer is open
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isPhotoViewerOpen.current) {
                setOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    return (
        <>
            {/* Trigger */}
            <span className={`cursor-pointer ${fullWidth ? 'w-full' : ''}`} onClick={() => setOpen(true)}>
                {children}
            </span>

            {/* Modal */}
            {open && (
                // Backdrop — react-photo-view renders in a portal so its clicks
                // never reach here and can never trigger the close.
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
                    onMouseDown={() => setOpen(false)}
                >
                    {/* Panel */}
                    <div
                        className="relative bg-background rounded-lg shadow-lg w-full max-w-lg flex flex-col p-6 mx-2 gap-4"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold leading-none tracking-tight">
                                Attachments
                            </h2>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <p className="text-base font-medium">Photos</p>
                        <div className="max-h-[80dvh] overflow-y-auto flex flex-col gap-5">
                            <div className="flex flex-wrap gap-2">
                                <ImageViewerProvider
                                    onVisibleChange={(visible) => {
                                        isPhotoViewerOpen.current = visible;
                                    }}
                                >
                                    {workOrder.attachments && workOrder.attachments.length > 0 &&
                                        workOrder.attachments.map((attachment, index) => (
                                            <div
                                                key={`${index}-${attachment.attachmentId}`}
                                                className="relative aspect-square rounded-md overflow-hidden border bg-muted cursor-pointer"
                                            >
                                                <ImageViewer url={attachment.url}>
                                                    <img
                                                        src={attachment.url}
                                                        alt=""
                                                        className="size-30 rounded object-cover border border-muted"
                                                        onError={() => handleImageError(attachment.url)}
                                                    />
                                                </ImageViewer>
                                            </div>
                                        ))
                                    }
                                </ImageViewerProvider>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}