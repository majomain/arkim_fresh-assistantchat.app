'use client';

import { RefreshCcw } from 'lucide-react';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

type RefreshButtonProps = {
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    label?: string;
    className?: string;
};

export default function RefreshButton({
    onClick,
    disabled,
    loading,
    label = 'Refresh',
    className,
}: RefreshButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'queue-filter-chip queue-filter-chip--square queue-filter-chip--icon chip-hover-border flex-shrink-0',
                        className,
                    )}
                    onClick={onClick}
                    disabled={disabled || loading}
                    aria-label={label}
                >
                    <RefreshCcw
                        className={cn('size-3.5', loading && 'animate-spin')}
                    />
                </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
                {label}
            </TooltipContent>
        </Tooltip>
    );
}
