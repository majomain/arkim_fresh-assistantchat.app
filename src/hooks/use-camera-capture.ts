'use client'

import { useRef, useState } from "react";

// ── Platform detection ────────────────────────────────────────────────────────
// iOS Safari ignores `capture` on ALL file inputs and always shows its own
// native sheet ("Photo Library / Take Photo / Choose Files") regardless.
// The capture attribute only works reliably on Android/Chrome.
// Desktop has no capture support at all → we use getUserMedia() instead.
export function isIOSDevice() {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroidDevice() {
    if (typeof navigator === 'undefined') return false;
    return /Android/i.test(navigator.userAgent);
}

export function useCameraCapture({ onCapture }: { onCapture: (file: File) => void }) {
    // Ref for the hidden <input capture="environment"> used on Android
    const cameraInputRef = useRef<HTMLInputElement>(null);
    // Controls the desktop WebcamModal
    const [webcamOpen, setWebcamOpen] = useState(false);

    // ── handleCameraClick ─────────────────────────────────────────────────────
    // Android → trigger the hidden capture input (Chrome respects it → camera)
    // iOS     → should never be called (iOS uses a single plain input instead,
    //           the OS itself shows the "Photo Library / Take Photo" sheet)
    // Desktop → open the WebcamModal (getUserMedia)
    function handleCameraClick() {
        if (isAndroidDevice()) {
            cameraInputRef.current?.click();
        } else {
            // Desktop fallback
            setWebcamOpen(true);
        }
    }

    // ── handleWebcamCapture ───────────────────────────────────────────────────
    // Receives the File from WebcamModal and forwards it to the consumer.
    function handleWebcamCapture(file: File) {
        onCapture(file);
    }

    function closeWebcam() {
        setWebcamOpen(false);
    }

    return {
        // Attach to a hidden <input type="file" capture="environment"> for Android
        cameraInputRef,
        // Pass to <WebcamModal open={webcamOpen} ...> for desktop
        webcamOpen,
        closeWebcam,
        // Attach to your "Camera" button
        handleCameraClick,
        // Pass to <WebcamModal onCapture={handleWebcamCapture}>
        handleWebcamCapture,
    };
}