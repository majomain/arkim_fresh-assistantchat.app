'use client';

import Search from "@/components/core/filters/Search";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorToast } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAsset } from "@/hooks/use-asset";
import { useLocation } from "@/hooks/use-location";
import workOrderService from "@/services/api/workOrderService";
import { WorkOrderDetail, WorkOrderDetailList, WorkOrderStatus } from "@/types/workOrder/workOrder";
import { ClipboardListIcon, RefreshCcw, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import TableView from "./TableView";
import CardView from "./CardView";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionHeader, AccordionItem } from "@/components/ui/accordian";
import { useDebounce } from "@/hooks/use-debounce";
import { useWorkOrderBroadcast } from "@/hooks/broadcasts/use-workorder-broadcast";
import { useChat } from "@/hooks/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { DatePicker } from "@/components/ui/datepicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

export default function WorkOrders() {
    // runtime utils
    const { user } = useAuth();
    const { currentAssetId, currentAsset } = useAsset();
    const { selectedLocation } = useLocation();
    const { postMessageAsync } = useChat();

    // responsive design flag
    const isMobile = useIsMobile();

    // is data loading flag
    const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
    // work order data
    const [workOrders, setWorkOrders] = useState<WorkOrderDetailList>([]);

    // search value
    const [search, setSearch] = useState<string>('');
    // status filter
    const [status, setStatus] = useState<'all' | WorkOrderStatus>('all');
    // due date
    const [dueDate, setDueDate] = useState<Date | undefined>();

    // broadcasting setup
    const { claimWorkOrder, requestRefresh, updateWorkOrder, refreshWorkOrderList } = useWorkOrderBroadcast((event) => {
        if (event.type === 'WORK_ORDER_CLAIMED') updateWorkOrder(setWorkOrders, event.workOrderId, event.siteId, event.status);
        if (event.type === 'WORK_ORDER_LIST_REFRESH') refreshWorkOrderList(getWorkOrders, event.siteId, event.assetId);
    });

    // get the date from utc timestamp
    function getDateFromTimestamp(timestamp: string) {
        const date = new Date(timestamp);

        return date.toLocaleDateString("en-CA");
    }

    // get the status label for UI
    function getStatusLabel(status: WorkOrderStatus) {
        let label = '';
        switch (status) {
            case 'open': label = 'Open';
                break;
            case 'cancelled': label = 'Cancelled';
                break;
            case 'completed': label = 'Completed';
                break;
            case 'thread_opened': label = 'In Progress';
                break;
        }

        return label;
    }

    const debouncedSearch = useDebounce(search, 400);
    const isTyping = search !== debouncedSearch;

    // get the assigned work order history
    const getWorkOrders = useCallback(async () => {
        try {
            if (selectedLocation && currentAssetId) {
                setIsDataLoading(true);

                const dateObj = new Date();
                const response =
                    await workOrderService.getAssignedWorkOrders(
                        dueDate ?? dateObj,
                        null,
                        currentAssetId,
                        status === 'all' ? null : status,
                        debouncedSearch ?? null
                    );

                setWorkOrders(response.filter((workOrder) => workOrder.threadOpenedBy === null || workOrder.threadOpenedBy === user?.email));
            }
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        } finally {
            setIsDataLoading(false);
        }
    }, [selectedLocation, currentAssetId, currentAsset?.threads, status, dueDate, debouncedSearch]);

    function createThreadFromWorkOrder(workOrder: WorkOrderDetail) {
        if (workOrder.status === 'open' && !workOrder.threadId) {
            claimWorkOrder(workOrder.id, workOrder.siteId, 'thread_opened');     // claim the work order for the user (FOR BROADCASTING PURPOSE ONLY)

            postMessageAsync(
                '',
                workOrder.assetId,
                '',
                true,
                '',
                {

                    workOrderId: workOrder.id,
                    dueDate: workOrder.dueDate,
                    title: workOrder.title
                },
                'assistant',
            );
        }
    }

    const handleRefresh = useCallback(() => {
        setSearch('');
        getWorkOrders();
        requestRefresh(selectedLocation?.id ?? '', currentAssetId ?? '');       // refresh work order list when requested by user (FOR BROADCASTING PURPOSE ONLY)
    }, [getWorkOrders, requestRefresh, selectedLocation, currentAssetId]);

    const activeFilterCount = [
        dueDate !== undefined,
        status !== 'all'
    ].filter(Boolean).length;

    function handleClearFilters() {
        setStatus('all');
        setSearch('');
        setDueDate(undefined);
    }

    useEffect(() => {
        getWorkOrders();
    }, [getWorkOrders]);

    useEffect(() => {
        setStatus('all');
        setSearch('');
        setDueDate(undefined);
    }, [currentAssetId]);

    return <div className="w-full bento px-6 py-4">
        <Accordion>
            <AccordionItem hideBorder={true} defaultOpen={!isMobile}>
                <AccordionHeader>
                    <div className="flex flex-row gap-1 items-center text-sm font-medium">
                        <ClipboardListIcon className="size-5" />
                        Work Orders
                        {isDataLoading ? (
                            <Skeleton className="size-4" />
                        ) : (
                            <span>
                                (
                                {workOrders
                                    ? workOrders.length
                                    : 0}
                                )
                            </span>
                        )}
                    </div>
                </AccordionHeader>
                <AccordionContent smoothHide={true} >
                    <div className='w-full flex justify-end mt-2 mb-4'>
                        <div className='flex flex-row items-center gap-2'>
                            <Tooltip>
                                <TooltipTrigger asChild disabled={isDataLoading || isTyping}>
                                    <Button variant='outline' size='icon' onClick={() => {
                                        if (!isDataLoading) {
                                            handleRefresh();
                                        }
                                    }}><RefreshCcw className='size-4' /></Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Refresh work orders
                                </TooltipContent>
                            </Tooltip>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="relative gap-2"
                                        disabled={isDataLoading || isTyping}
                                    >
                                        <SlidersHorizontal className="size-4" />
                                        Filters
                                        {activeFilterCount > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="end"
                                    className="w-72 p-4"
                                    sideOffset={6}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-semibold">Filters</p>
                                        {activeFilterCount > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground px-2"
                                                onClick={handleClearFilters}
                                            >
                                                <X className="size-3" />
                                                Clear all
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {/* Due date */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">End Date</label>
                                            <DatePicker
                                                selected={dueDate}
                                                onSelect={(date) => setDueDate(date)}
                                                toDate={new Date()}
                                                disabled={isDataLoading || isTyping}
                                                placeholder="Pick end date"
                                                className="w-full"
                                            />
                                        </div>

                                        <Separator />

                                        {/* Status */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Status</label>
                                            <Select
                                                defaultValue="all"
                                                value={status}
                                                onValueChange={async (value) => {
                                                    setStatus(value as 'all' | WorkOrderStatus);
                                                }}
                                                disabled={isDataLoading || isTyping}
                                            >
                                                <SelectTrigger className="w-full bg-sidebar-accent hover:bg-accent hover:text-accent-foreground focus:ring-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All</SelectItem>
                                                    <SelectItem value="open">Open</SelectItem>
                                                    <SelectItem value="thread_opened">In Progress</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Search
                                search={search}
                                setSearch={setSearch}
                            />
                        </div>
                    </div>

                    <TableView
                        filteredWorkOrderList={workOrders}
                        getStatusLabel={getStatusLabel}
                        getDateFromTimestamp={getDateFromTimestamp}
                        isDataLoading={isDataLoading || isTyping}
                        createThreadFromWorkOrder={createThreadFromWorkOrder}
                    />

                    <CardView
                        filterWorkOrderList={workOrders}
                        getStatusLabel={getStatusLabel}
                        getDateFromTimestamp={getDateFromTimestamp}
                        isDataLoading={isDataLoading || isTyping}
                        createThreadFromWorkOrder={createThreadFromWorkOrder}
                    />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>;
}