'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';

export type SortType = {
    setValue: (value: any) => void;
    value: any;
    options: {
        label: string;
        value: string;
        order?: 'asc' | 'desc';
    }[];
};
export default function Sort({
    sorts,
    shadowCard = false,
}: {
    sorts: SortType;
    shadowCard?: boolean;
}) {
    const isMobile = useIsMobile();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                asChild
                className={cn(
                    shadowCard &&
                        'border-1 border-muted bg-card shadow-md shadow-card-shadow rounded-md',
                )}
            >
                <Button variant="outline" size="sm">
                    <ArrowUpDownIcon /> {!isMobile && 'Sort'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="p-2 flex flex-row gap-4 bg-card"
            >
                <div className="flex flex-col gap-2">
                    {sorts.options.map((sort) => {
                        return (
                            <label
                                key={sort.value}
                                className="flex flex-row items-center gap-2 cursor-pointer p-1 rounded-md hover:bg-muted"
                                htmlFor={sort.value}
                            >
                                <Input
                                    type="radio"
                                    id={sort.value}
                                    name="sort"
                                    value={sort.value}
                                    checked={sorts.value === sort.value}
                                    onChange={() => sorts.setValue(sort.value)}
                                    className="size-4"
                                />
                                <p className="flex flex-row items-center gap-2">
                                    {sort.label}{' '}
                                    {sort.order ? (
                                        sort.order === 'asc' ? (
                                            <ArrowUpIcon className="size-4" />
                                        ) : (
                                            <ArrowDownIcon className="size-4" />
                                        )
                                    ) : null}
                                </p>
                            </label>
                        );
                    })}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
