'use client';

import dayjs from 'dayjs';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export function DatePicker({
    selected,
    onSelect,
    fromDate,
    toDate,
    disabled,
    placeholder = 'Pick a date',
    className = '',
}: {
    selected?: Date;
    onSelect?: (date: Date | undefined) => void;
    fromDate?: Date;
    toDate?: Date;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}) {
    const [open, setOpen] = React.useState(false);
    const [month, setMonth] = React.useState<Date>(selected ?? new Date());

    // When popover opens, always jump to the selected date's month
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) setMonth(selected ?? new Date());
        setOpen(isOpen);
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        'w-fit justify-start text-left font-normal',
                        !selected && 'text-muted-foreground',
                        className,
                    )}
                    disabled={disabled}
                >
                    {selected ? (
                        dayjs(selected).format('MMM D, YYYY')
                    ) : (
                        <span>{placeholder}</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[250px] p-0 max-w-[300px]"
                align="start"
            >
                <Calendar
                    mode="single"
                    captionLayout="label"
                    className="w-full"
                    selected={selected}
                    month={month}
                    onMonthChange={setMonth}
                    onSelect={(d) => {
                        onSelect?.(d);
                        if (d !== undefined) setOpen(false);
                    }}
                    disabled={(d) => {
                        if (fromDate && d < fromDate) return true;
                        if (toDate && d > toDate) return true;
                        return false;
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
