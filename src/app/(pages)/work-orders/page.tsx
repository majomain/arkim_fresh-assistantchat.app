'use client';

import { useWorkOrderBroadcast } from '@/hooks/broadcasts/use-workorder-broadcast';
import { useAsset } from '@/hooks/use-asset';
import { useAuth } from '@/hooks/use-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { useLocation } from '@/hooks/use-location';
import workOrderService from '@/services/api/workOrderService';
import {
    WorkOrderDetailList,
    WorkOrderStatus,
} from '@/types/workOrder/workOrder';
import { ClipboardListIcon, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import RefreshButton from '@/components/core/RefreshButton';
import Search from '@/components/core/filters/Search';
import DisplayCard from '@/components/core/work-order/DisplayCard';
import PageTopBar from '@/components/layout/PageTopBar';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/datepicker';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { errorToast } from '@/components/ui/sonner';

import { cn } from '@/lib/utils';

import WorkOrdersSkeleton from './WorkOrdersSkeleton';

const VALID_STATUSES: WorkOrderStatus[] = [
    'open',
    'thread_opened',
    'cancelled',
    'completed',
];

// Derive the initial filter values directly from URL params at module-call
// time so useState is seeded correctly on the very first render — no effects,
// no extra renders, no race conditions.
function getInitialFilters(searchParams: URLSearchParams) {
    const dueDateParam = searchParams.get('dueDate');
    const statusParam = searchParams.get('status');

    const selectedDueDate =
        dueDateParam && !isNaN(new Date(dueDateParam).getTime())
            ? new Date(dueDateParam)
            : undefined;

    // Accept any valid WorkOrderStatus value, or 'all'; fall back to ''
    const status: '' | 'all' | WorkOrderStatus =
        statusParam === 'all'
            ? 'all'
            : VALID_STATUSES.includes(statusParam as WorkOrderStatus)
              ? (statusParam as WorkOrderStatus)
              : '';

    return { selectedDueDate, status };
}

type TabFilter = 'all' | 'overdue' | 'today' | 'week';

function getDayDiffFromToday(d: string, today: Date): number {
    const due = new Date(d.includes('T') ? d : `${d}T00:00:00`);
    return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function isWorkOrderOverdue(w: WorkOrderDetailList[0], today: Date): boolean {
    return (
        (w.status === 'open' || w.status === 'thread_opened') &&
        getDayDiffFromToday(w.dueDate, today) < 0
    );
}

function isWorkOrderDueToday(w: WorkOrderDetailList[0], today: Date): boolean {
    return getDayDiffFromToday(w.dueDate, today) === 0;
}

function isWorkOrderDueThisWeek(
    w: WorkOrderDetailList[0],
    today: Date,
): boolean {
    const diff = getDayDiffFromToday(w.dueDate, today);
    return diff > 0 && diff <= 7;
}

function urgencyScore(w: WorkOrderDetailList[0], today: Date): number {
    if (isWorkOrderOverdue(w, today)) return 0;
    if (isWorkOrderDueToday(w, today)) return 1;
    const diff = getDayDiffFromToday(w.dueDate, today);
    if (diff > 0 && diff <= 7) return 2;
    return 3;
}

export default function WorkOrderPage() {
    const { user } = useAuth();
    const { isAssetListLoading, assetList } = useAsset();

    const { selectedLocation } = useLocation();

    const searchParams = useSearchParams();

    // ─── Seed state synchronously from URL params ─────────────────────────────
    const [{ selectedDueDate: initialDueDate, status: initialStatus }] =
        useState(() => getInitialFilters(searchParams));
    const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(
        initialDueDate,
    );
    const [status, setStatus] = useState<'' | 'all' | WorkOrderStatus>(
        initialStatus,
    );

    const [workOrders, setWorkOrders] = useState<WorkOrderDetailList>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedAssetId, setSelectedAssetId] = useState<string>('');
    const [search, setSearch] = useState<string>('');
    const [tabFilter, setTabFilter] = useState<TabFilter>('today');
    const debouncedSearch = useDebounce(search, 400);
    const isTyping = search !== debouncedSearch;

    // Use a ref to always have the latest fetch params without stale closures
    const filtersRef = useRef({
        selectedDueDate,
        selectedAssetId,
        status,
        debouncedSearch,
        selectedLocation,
    });
    useEffect(() => {
        filtersRef.current = {
            selectedDueDate,
            selectedAssetId,
            status,
            debouncedSearch,
            selectedLocation,
        };
    }, [
        selectedDueDate,
        selectedAssetId,
        status,
        debouncedSearch,
        selectedLocation,
    ]);

    // ─── Clear all filters when location changes ──────────────────────────────
    const prevLocationId = useRef(selectedLocation?.id);
    if (prevLocationId.current !== selectedLocation?.id) {
        prevLocationId.current = selectedLocation?.id;
        // Reset state
        setSelectedDueDate(undefined);
        setStatus('');
        setSelectedAssetId('');
        setSearch('');
        setTabFilter('today');
        filtersRef.current = {
            ...filtersRef.current,
            selectedDueDate: undefined,
            status: '',
            selectedAssetId: '',
            debouncedSearch: '',
            selectedLocation,
        };
    }

    // Core fetch — always reads from filtersRef so it's never stale
    const getWorkOrders = useCallback(async () => {
        const {
            selectedDueDate,
            selectedAssetId,
            status,
            debouncedSearch,
            selectedLocation,
        } = filtersRef.current;
        if (!selectedLocation) return;

        try {
            setIsLoading(true);
            const response = await workOrderService.getAssignedWorkOrders(
                selectedDueDate,
                selectedAssetId && selectedAssetId !== 'all'
                    ? ''
                    : selectedLocation.id,
                selectedAssetId && selectedAssetId !== 'all'
                    ? selectedAssetId
                    : null,
                status && status !== 'all' ? status : null,
                debouncedSearch,
            );
            setWorkOrders(
                response.filter(
                    (wo) =>
                        wo.threadOpenedBy === null ||
                        wo.threadOpenedBy === user?.email,
                ),
            );
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, []); // stable — no deps needed because it reads from ref

    // broadcasting setup
    const { requestRefresh, removeWorkOrder, refreshWorkOrderList } =
        useWorkOrderBroadcast((event) => {
            if (event.type === 'WORK_ORDER_CLAIMED')
                removeWorkOrder(setWorkOrders, event.workOrderId, event.siteId);
            if (event.type === 'WORK_ORDER_LIST_REFRESH')
                refreshWorkOrderList(getWorkOrders, event.siteId);
        });

    function getStatusLabel(status: WorkOrderStatus) {
        switch (status) {
            case 'open':
                return 'Open';
            case 'cancelled':
                return 'Cancelled';
            case 'completed':
                return 'Completed';
            case 'thread_opened':
                return 'In Progress';
        }
    }

    // ─── Single effect: re-fetches whenever any filter or location changes ────
    // No initialisation guard needed — state is already correct on mount.
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            getWorkOrders(); // initial fetch with already-correct state
            return;
        }
        if (isTyping) return;
        getWorkOrders();
    }, [
        selectedDueDate,
        selectedAssetId,
        status,
        debouncedSearch,
        selectedLocation,
        isTyping,
        getWorkOrders,
    ]);

    const sortedWorkOrders = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return [...workOrders].sort((a, b) => {
            const urgencyDiff = urgencyScore(a, today) - urgencyScore(b, today);
            if (urgencyDiff !== 0) return urgencyDiff;
            return a.dueDate.localeCompare(b.dueDate);
        });
    }, [workOrders]);

    const handleRefresh = useCallback(() => {
        getWorkOrders();
        requestRefresh(selectedLocation?.id ?? '');
    }, [getWorkOrders, requestRefresh, selectedLocation]);

    const activeFilterCount = [
        selectedDueDate !== undefined,
        status !== '' && status !== 'all',
        selectedAssetId !== '' && selectedAssetId !== 'all',
    ].filter(Boolean).length;

    const handleClearFilters = () => {
        setSelectedDueDate(undefined);
        setStatus('');
        setSelectedAssetId('');
    };

    // ── Bucket helpers ────────────────────────────────────────────────────────
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);
    const isOverdue = useCallback(
        (w: (typeof sortedWorkOrders)[0]) => isWorkOrderOverdue(w, today),
        [today],
    );
    const isDueToday = useCallback(
        (w: (typeof sortedWorkOrders)[0]) => isWorkOrderDueToday(w, today),
        [today],
    );
    const isDueThisWeek = useCallback(
        (w: (typeof sortedWorkOrders)[0]) => isWorkOrderDueThisWeek(w, today),
        [today],
    );

    // ── Quick-filter counts + filtered list ──────────────────────────────────
    const counts = {
        all: sortedWorkOrders.length,
        overdue: sortedWorkOrders.filter(isOverdue).length,
        today: sortedWorkOrders.filter(isDueToday).length,
        week: sortedWorkOrders.filter(isDueThisWeek).length,
    };
    const tabFiltered =
        tabFilter === 'all'
            ? sortedWorkOrders
            : tabFilter === 'overdue'
              ? sortedWorkOrders.filter(isOverdue)
              : tabFilter === 'today'
                ? sortedWorkOrders.filter(isDueToday)
                : sortedWorkOrders.filter(isDueThisWeek);

    const tabs: { k: TabFilter; label: string }[] = [
        { k: 'today', label: 'Today' },
        { k: 'week', label: 'This week' },
        { k: 'overdue', label: 'Overdue' },
        { k: 'all', label: 'All' },
    ];

    return (
        <div
            className="flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100dvh-1.25rem)]"
            style={{ gap: 0 }}
        >
            <PageTopBar title="My Work Orders" />

            {/* ── Queue filters ─────────────────────────────────────────── */}
            <div className="flex-shrink-0 flex items-center gap-1.5 px-1 py-2.5 overflow-x-auto">
                {!isLoading &&
                    !isTyping &&
                    !isAssetListLoading &&
                    tabs.map(({ k, label }) => {
                        const active = tabFilter === k;
                        const value = counts[k];
                        const overdueCount =
                            k === 'overdue' && value > 0 && !active;
                        return (
                            <button
                                key={k}
                                type="button"
                                onClick={() => setTabFilter(k)}
                                className={cn(
                                    'queue-filter-chip',
                                    active && 'tab-chip-active',
                                    !active && 'chip-hover-border',
                                )}
                                aria-current={active ? 'true' : undefined}
                            >
                                {label}
                                <span
                                    className="type-micro"
                                    style={{
                                        fontWeight: 700,
                                        opacity: active
                                            ? 0.85
                                            : overdueCount
                                              ? 1
                                              : 0.5,
                                        color: overdueCount
                                            ? 'var(--st-overdue)'
                                            : undefined,
                                    }}
                                >
                                    {value}
                                </span>
                            </button>
                        );
                    })}

                <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                    <Search
                        search={search}
                        setSearch={setSearch}
                        placeHolder="Search work orders"
                        className="w-44 sm:w-52 md:w-60"
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    'queue-filter-chip queue-filter-chip--square',
                                    activeFilterCount > 0
                                        ? 'tab-chip-active'
                                        : 'chip-hover-border',
                                )}
                                disabled={isLoading || isTyping}
                            >
                                <SlidersHorizontal className="size-3.5" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span
                                        className="type-micro"
                                        style={{
                                            fontWeight: 700,
                                            opacity: 0.85,
                                        }}
                                    >
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="end"
                            className="w-68 p-4"
                            sideOffset={6}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p
                                    className="type-body"
                                    style={{ fontWeight: 600 }}
                                >
                                    Advanced filters
                                </p>
                                {activeFilterCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 gap-1 text-xs text-muted-foreground px-2"
                                        onClick={handleClearFilters}
                                    >
                                        <X className="size-3" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Due Date
                                    </label>
                                    <DatePicker
                                        selected={selectedDueDate}
                                        onSelect={(date) =>
                                            setSelectedDueDate(date)
                                        }
                                        toDate={new Date()}
                                        disabled={isLoading || isTyping}
                                        placeholder="Pick due date"
                                        className="w-full"
                                    />
                                </div>
                                <Separator />
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Status
                                    </label>
                                    <Select
                                        value={status}
                                        onValueChange={(v) =>
                                            setStatus(
                                                v as 'all' | WorkOrderStatus,
                                            )
                                        }
                                        disabled={isLoading || isTyping}
                                    >
                                        <SelectTrigger className="w-full focus:ring-0">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All
                                            </SelectItem>
                                            <SelectItem value="open">
                                                Open
                                            </SelectItem>
                                            <SelectItem value="thread_opened">
                                                In Progress
                                            </SelectItem>
                                            <SelectItem value="completed">
                                                Completed
                                            </SelectItem>
                                            <SelectItem value="cancelled">
                                                Cancelled
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Separator />
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Asset
                                    </label>
                                    <Select
                                        value={selectedAssetId}
                                        onValueChange={(v) =>
                                            setSelectedAssetId(v ?? '')
                                        }
                                        disabled={isLoading || isTyping}
                                    >
                                        <SelectTrigger className="w-full focus:ring-0">
                                            <SelectValue placeholder="Select asset" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Assets
                                            </SelectItem>
                                            <Separator className="my-1" />
                                            {assetList.map((a) => (
                                                <SelectItem
                                                    key={a.id}
                                                    value={a.id}
                                                >
                                                    {a.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <RefreshButton
                        onClick={handleRefresh}
                        disabled={isTyping}
                        loading={isLoading}
                    />
                </div>
            </div>

            {/* ── Card grid ───────────────────────────────────────────────── */}
            <div
                className="flex-1 min-h-0 overflow-y-auto scrollable"
                style={{ padding: '14px 4px 24px' }}
            >
                {isLoading || isTyping || isAssetListLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 content-start px-1">
                        <WorkOrdersSkeleton />
                    </div>
                ) : tabFiltered.length ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 content-start px-1">
                        {tabFiltered.map((workOrder, index) => (
                            <DisplayCard
                                key={`workorder-${workOrder.id}-${index}`}
                                workOrder={workOrder}
                                getStatusLabel={getStatusLabel}
                            />
                        ))}
                    </div>
                ) : (
                    /* Empty state — secondary copy per spec §3 */
                    <div
                        className="w-full h-full flex flex-col items-center justify-center gap-3"
                        style={{ minHeight: 320 }}
                    >
                        <ClipboardListIcon
                            style={{
                                width: 48,
                                height: 48,
                                color: 'var(--muted-col)',
                                opacity: 0.4,
                            }}
                            strokeWidth={1.1}
                        />
                        <p
                            className="type-section"
                            style={{
                                fontWeight: 300,
                                color: 'var(--text-strong)',
                                letterSpacing: '-0.2px',
                            }}
                        >
                            {tabFilter !== 'all'
                                ? `No ${tabs.find((t) => t.k === tabFilter)?.label.toLowerCase()} work orders`
                                : 'No work orders'}
                        </p>
                        <p
                            className="serif type-medium"
                            style={{ color: 'var(--muted-col)' }}
                        >
                            {tabFilter !== 'all'
                                ? 'Try "All" to see the full queue.'
                                : 'Nothing assigned right now.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
