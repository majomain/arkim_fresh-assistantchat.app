'use client';

import messagingService from '@/services/api/messagingService';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

interface MessageRatingProps {
    threadId: string;
    messageId: string;
    rate: number;
}

export default function MessageRating({
    threadId,
    messageId,
    rate: initialRate,
}: MessageRatingProps) {
    const [currentRate, setCurrentRate] = useState<number>(initialRate);
    const [isLoading, setIsLoading] = useState(false);

    async function handleRate(isThumbsUp: boolean) {
        if (isLoading) return;

        const newRateInt = isThumbsUp ? 1 : -1;
        // If clicking the same active button, unrate (set to 0)
        const targetRate = currentRate === newRateInt ? 0 : newRateInt;

        setIsLoading(true);
        const previousRate = currentRate;
        setCurrentRate(targetRate); // Optimistic update
        try {
            await messagingService.rateMessage(threadId, messageId, targetRate);
        } catch {
            setCurrentRate(previousRate); // Revert on error
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-row gap-3.5 items-center">
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => handleRate(true)}
                        disabled={isLoading}
                        type="button"
                        className={cn(currentRate === 1 ? 'text-success' : '')}
                    >
                        <ThumbsUp className={cn('w-4 h-4')} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    {currentRate === 1 ? 'Remove rating' : 'Helpful'}
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => handleRate(false)}
                        disabled={isLoading}
                        type="button"
                        className={cn(
                            currentRate === -1 ? 'text-destructive' : '',
                        )}
                    >
                        <ThumbsDown className={cn('w-4 h-4')} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    {currentRate === -1 ? 'Remove rating' : 'Not helpful'}
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
