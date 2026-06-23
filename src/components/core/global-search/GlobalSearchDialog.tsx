'use client';

import { useDebounce } from '@/hooks/use-debounce';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import Search from '../filters/Search';
import AssetSearch from './AssetSearch';
import ThreadSearch from './ThreadSearch';
import WorkOrderSearch from './WorkOrderSearch';

type TabKey = 'work-order' | 'asset' | 'thread';

export default function GlobalSearchDialog() {
    const [currentTab, setCurrentTab] = useState<TabKey>('work-order');
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState<string>('');

    const debouncedSearch = useDebounce(search, 400);
    const isTyping = search !== debouncedSearch;

    function clearStates() {
        setCurrentTab('work-order');
        setSearch('');
    }

    // close the dialog with cleanup
    function closeDialog() {
        setOpen(false);
        clearStates();
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);

                if (!isOpen) {
                    closeDialog();
                }
            }}
        >
            <DialogTrigger
                className="w-full cursor-pointer rounded-md hover:bg-sidebar-accent"
                asChild
            >
                <div className="sidebar-collapse-item w-full h-8 px-2 py-1.5 group/search">
                    <SearchIcon className="size-4 shrink-0 !text-muted-foreground group-hover/search:!text-foreground" />

                    <span className="sidebar-collapse-text text-foreground">
                        Search
                    </span>
                </div>
            </DialogTrigger>
            <DialogContent
                onCloseAutoFocus={(e) => {
                    e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle>Search</DialogTitle>
                    <DialogDescription />
                </DialogHeader>

                <Tabs
                    value={currentTab}
                    onValueChange={(value) => setCurrentTab(value as TabKey)}
                    className="w-full flex flex-col gap-8 -mt-2"
                >
                    <div className="flex flex-col gap-1">
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="work-order" className="text-xs">
                                Work Orders
                            </TabsTrigger>
                            <TabsTrigger value="asset" className="text-xs">
                                Assets
                            </TabsTrigger>
                            <TabsTrigger value="thread" className="text-xs">
                                Open Threads
                            </TabsTrigger>
                        </TabsList>

                        <Search
                            search={search}
                            setSearch={setSearch}
                            placeHolder="Search here..."
                            className="mt-2 bg-transparent"
                        />
                    </div>

                    <div>
                        <TabsContent value="work-order">
                            <WorkOrderSearch
                                isTyping={isTyping}
                                search={debouncedSearch}
                                closeDialog={closeDialog}
                            />
                        </TabsContent>

                        <TabsContent value="asset">
                            <AssetSearch
                                isTyping={isTyping}
                                search={debouncedSearch}
                                closeDialog={closeDialog}
                            />
                        </TabsContent>

                        <TabsContent value="thread">
                            <ThreadSearch
                                isTyping={isTyping}
                                search={debouncedSearch}
                                closeDialog={closeDialog}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
