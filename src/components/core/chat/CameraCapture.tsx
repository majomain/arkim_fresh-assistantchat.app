'use client'

import { useRef, useState, useEffect } from "react";
import { Camera, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

// ── WebcamModal ───────────────────────────────────────────────────────────────
// Desktop-only. Streams the webcam via getUserMedia, lets the user snap a
// frame, and returns it as a JPEG File through onCapture.
// Exported so it can be placed anywhere in the consuming component's JSX tree.
export function WebcamModal({ open, onClose, onCapture }: {
    open: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [ready, setReady] = useState(false);
    const [camError, setCamError] = useState<string | null>(null);

    // Start stream when modal opens; clean up tracks on close / unmount
    // so the camera indicator light turns off properly.
    useEffect(() => {
        if (!open) return;
        setCamError(null);
        setReady(false);

        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
            .then((stream) => {
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => setReady(true);
                }
            })
            .catch(() => setCamError('Camera permission denied or unavailable.'));

        return () => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        };
    }, [open]);

    function capture() {
        const video = videoRef.current;
        if (!video) return;
        // Draw the current frame onto an offscreen canvas, export as JPEG File
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            onClose();
        }, 'image/jpeg', 0.92);
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="w-sm p-3 gap-3" hideCloseButton>
                <DialogTitle />
                <DialogDescription />
                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={cn('w-full h-full object-cover', !ready && 'opacity-0')}
                    />
                    {!ready && !camError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2Icon className="size-6 animate-spin text-white" />
                        </div>
                    )}
                    {camError && (
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <p className="text-sm text-destructive text-center">{camError}</p>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-md border border-muted py-1.5 text-sm hover:bg-muted transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={capture}
                        disabled={!ready}
                        className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground py-1.5 text-sm disabled:opacity-50 transition-opacity"
                    >
                        <Camera className="size-4" /> Capture
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}