'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { FunnelIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';

export type FilterTabType = {
    value: string;
    label: string;
};

export type FilterOptionType = {
    label: string;
    value: string;
};

export type FilterType = {
    tab: string;
    type: 'list' | 'date';
    options?: FilterOptionType[];
    value: string;
    setValue: (v: any) => void;
};

export default function Filter({
    filterTabs,
    filters,
    applyFilter,
    clearFilter,
    shadowCard = false,
}: {
    filterTabs: FilterTabType[];
    filters: FilterType[];
    applyFilter: () => void;
    clearFilter: () => void;
    shadowCard?: boolean;
}) {
    // current tab flag
    const [currentTab, setCurrentTab] = useState<FilterTabType['value']>(
        filterTabs[0]?.value || '',
    );
    // open state for dropdown
    const [open, setOpen] = useState<boolean>(false);
    const isMobile = useIsMobile();

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                asChild
                className={cn(
                    shadowCard && 'border-1 border-muted bg-card rounded-md',
                )}
            >
                <Button variant="outline">
                    <FunnelIcon /> {!isMobile && 'Filters'}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                className="bg-card w-70 overflow-hidden"
            >
                <div className="flex flex-row">
                    <div className="flex flex-col gap-5 p-2 border-r-1">
                        {filterTabs.map((ft) => (
                            <p
                                key={ft.value}
                                className={cn(
                                    'w-full text-center text-sm font-semibold p-1 rounded-md border-1 border-transparent cursor-pointer',
                                    currentTab === ft.value
                                        ? 'text-primary'
                                        : 'hover:border-border',
                                )}
                                onClick={() => setCurrentTab(ft.value)}
                            >
                                {ft.label}
                            </p>
                        ))}
                    </div>

                    <div className="p-2 overflow-auto h-40 w-full">
                        {filters.map((filter) => {
                            if (filter.tab !== currentTab) return null;

                            if (filter.type === 'list' && filter.options) {
                                return (
                                    <div
                                        key={filter.tab}
                                        className="flex flex-col gap-2"
                                    >
                                        {filter.options.map((option) => {
                                            return (
                                                <p
                                                    key={option.value}
                                                    className={cn(
                                                        'text-sm cursor-pointer p-1.5 rounded-md',
                                                        filter.value ===
                                                            option.value
                                                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                                            : 'hover:bg-muted',
                                                    )}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        filter.setValue(
                                                            option.value,
                                                        );
                                                    }}
                                                >
                                                    {option.label}
                                                </p>
                                            );
                                        })}
                                    </div>
                                );
                            }

                            if (filter.type === 'date') {
                                return (
                                    <input
                                        key={filter.tab}
                                        type="date"
                                        value={filter.value}
                                        onChange={(e) =>
                                            filter.setValue(e.target.value)
                                        }
                                    />
                                );
                            }

                            return null;
                        })}
                    </div>
                </div>

                <div className="border-t-1 pb-2 pt-4 px-2 flex flex-row items-center justify-end gap-4">
                    <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                            applyFilter();
                            setOpen(false);
                        }}
                    >
                        Apply
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                            clearFilter();
                            setOpen(false);
                            setCurrentTab(filterTabs[0].value);
                        }}
                    >
                        Clear All
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
