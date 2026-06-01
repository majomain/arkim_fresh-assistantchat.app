'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import messagingService from "@/services/api/messagingService";
import { Star } from "lucide-react";
import { useState } from "react";

interface ThreadRatingProps {
    threadId: string;
    open: boolean;
    onClose: () => void;
}

export default function ThreadRating({ threadId, open, onClose }: ThreadRatingProps) {
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleSubmit() {
        if (selectedRating === null) return;

        // Fire and forget — close immediately
        messagingService.rateThread(
            threadId,
            selectedRating,
            feedback.trim() || undefined,
        ).catch(() => {});
        onClose();
    }

    function handleSkip() {
        onClose();
    }

    const displayRating = hoveredRating ?? selectedRating;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleSkip(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Rate this conversation</DialogTitle>
                    <DialogDescription>
                        How would you rate your overall experience with this conversation?
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center gap-2 py-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setSelectedRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(null)}
                            className="p-1 transition-transform hover:scale-110"
                        >
                            <Star
                                className={cn(
                                    "w-8 h-8 transition-colors",
                                    displayRating !== null && star <= displayRating
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-muted-foreground"
                                )}
                            />
                        </button>
                    ))}
                </div>

                <p className="text-center text-sm text-muted-foreground h-5">
                    {displayRating === 1 && "Poor"}
                    {displayRating === 2 && "Fair"}
                    {displayRating === 3 && "Good"}
                    {displayRating === 4 && "Very good"}
                    {displayRating === 5 && "Excellent"}
                </p>

                <textarea
                    placeholder="Tell us more about your experience (optional)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    className="placeholder:text-muted-foreground border-input dark:bg-input/30 flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none"
                />

                <DialogFooter className="flex gap-2 sm:justify-between">
                    <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
                        Skip
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={selectedRating === null || isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
