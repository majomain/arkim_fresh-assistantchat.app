'use client';
import { useLocation } from '@/hooks/use-location';
import {
    ClipboardListIcon,
    RefreshCcw,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { errorToast } from '@/components/ui/sonner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useAsset } from '@/hooks/use-asset';
import workOrderService from '@/services/api/workOrderService';
import { WorkOrderDetailList, WorkOrderStatus } from '@/types/workOrder/workOrder';
import { useWorkOrderBroadcast } from '@/hooks/broadcasts/use-workorder-broadcast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/datepicker';
import WorkOrdersSkeleton from './WorkOrdersSkeleton';
import Search from '@/components/core/filters/Search';
import { useDebounce } from '@/hooks/use-debounce';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DisplayCard from '@/components/core/work-order/DisplayCard';
import { useAuth } from '@/hooks/use-auth';

const VALID_STATUSES: WorkOrderStatus[] = ['open', 'thread_opened', 'cancelled', 'completed'];

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

export default function WorkOrderPage() {
    const { user } = useAuth();
    const { isAssetListLoading, assetList } = useAsset();

    const { selectedLocation } = useLocation();

    const searchParams = useSearchParams();

    // ─── Seed state synchronously from URL params ─────────────────────────────
    const [{ selectedDueDate: initialDueDate, status: initialStatus }] = useState(
        () => getInitialFilters(searchParams)
    );
    const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(initialDueDate);
    const [status, setStatus] = useState<'' | 'all' | WorkOrderStatus>(initialStatus);

    const [workOrders, setWorkOrders] = useState<WorkOrderDetailList>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedAssetId, setSelectedAssetId] = useState<string>('');
    const [search, setSearch] = useState<string>('');
    const [tabFilter, setTabFilter] = useState<'all' | 'overdue' | 'today' | 'week'>('all');
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
        filtersRef.current = { selectedDueDate, selectedAssetId, status, debouncedSearch, selectedLocation };
    }, [selectedDueDate, selectedAssetId, status, debouncedSearch, selectedLocation]);


    // ─── Clear all filters when location changes ──────────────────────────────
    const prevLocationId = useRef(selectedLocation?.id);
    if (prevLocationId.current !== selectedLocation?.id) {
        prevLocationId.current = selectedLocation?.id;
        // Reset state
        setSelectedDueDate(undefined);
        setStatus('');
        setSelectedAssetId('');
        setSearch('');
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
        const { selectedDueDate, selectedAssetId, status, debouncedSearch, selectedLocation } = filtersRef.current;
        if (!selectedLocation) return;

        try {
            setIsLoading(true);
            const response = await workOrderService.getAssignedWorkOrders(
                selectedDueDate,
                selectedAssetId && selectedAssetId !== 'all' ? '' : selectedLocation.id,
                selectedAssetId && selectedAssetId !== 'all' ? selectedAssetId : null,
                status && status !== 'all' ? status : null,
                debouncedSearch,
            );
            setWorkOrders(response.filter((wo) => wo.threadOpenedBy === null || wo.threadOpenedBy === user?.email));
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, []); // stable — no deps needed because it reads from ref

    // broadcasting setup
    const { requestRefresh, removeWorkOrder, refreshWorkOrderList } = useWorkOrderBroadcast((event) => {
        if (event.type === 'WORK_ORDER_CLAIMED') removeWorkOrder(setWorkOrders, event.workOrderId, event.siteId);
        if (event.type === 'WORK_ORDER_LIST_REFRESH') refreshWorkOrderList(getWorkOrders, event.siteId);
    });

    function getStatusLabel(status: WorkOrderStatus) {
        switch (status) {
            case 'open': return 'Open';
            case 'cancelled': return 'Cancelled';
            case 'completed': return 'Completed';
            case 'thread_opened': return 'In Progress';
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
    }, [selectedDueDate, selectedAssetId, status, debouncedSearch, selectedLocation, isTyping, getWorkOrders]);

    const sortedWorkOrders = useMemo(() => {
        return [...workOrders].sort((a, b) => b.dueDate.localeCompare(a.dueDate));
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
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const getDayDiff = (d: string) => {
        const due = new Date((d.includes('T') ? d : `${d}T00:00:00`));
        return Math.round((due.getTime() - today.getTime()) / 86_400_000);
    };
    const isOverdue = (w: typeof sortedWorkOrders[0]) =>
        (w.status === 'open' || w.status === 'thread_opened') && getDayDiff(w.dueDate) < 0;
    const isDueToday = (w: typeof sortedWorkOrders[0]) => getDayDiff(w.dueDate) === 0;
    const isDueThisWeek = (w: typeof sortedWorkOrders[0]) => {
        const d = getDayDiff(w.dueDate); return d > 0 && d <= 7;
    };

    // ── Quick-filter counts + filtered list ──────────────────────────────────
    const counts = {
        all:     sortedWorkOrders.length,
        overdue: sortedWorkOrders.filter(isOverdue).length,
        today:   sortedWorkOrders.filter(isDueToday).length,
        week:    sortedWorkOrders.filter(isDueThisWeek).length,
    };
    const tabFiltered = tabFilter === 'all'     ? sortedWorkOrders
        : tabFilter === 'overdue' ? sortedWorkOrders.filter(isOverdue)
        : tabFilter === 'today'   ? sortedWorkOrders.filter(isDueToday)
        : sortedWorkOrders.filter(isDueThisWeek);

    const tabs: { k: typeof tabFilter; label: string }[] = [
        { k: 'all', label: 'All' },
        { k: 'overdue', label: 'Overdue' },
        { k: 'today', label: 'Today' },
        { k: 'week', label: 'This week' },
    ];

    return (
        <div className="flex flex-col h-[calc(100dvh-4.5rem)]" style={{ gap: 0 }}>

            {/* ── Top bar ─────────────────────────────────────────────────── */}
            <div className="flex-shrink-0 flex items-center gap-3 px-1 py-3" style={{ borderBottom: '1px solid var(--border-col)' }}>
                <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.2px', color: 'var(--text-strong)', lineHeight: 1.2 }}>
                        My Work Orders
                    </p>
                    {sortedWorkOrders.length > 0 && (
                        <p style={{ fontSize: 13, color: 'var(--muted-col)', marginTop: 2 }}>
                            {sortedWorkOrders.length} open
                            {counts.overdue > 0 && <span style={{ color: 'var(--st-overdue)' }}> · {counts.overdue} overdue</span>}
                        </p>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Search search={search} setSearch={setSearch} placeHolder="Search work orders" />

                    {/* Advanced filters */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="relative gap-1.5 h-8 px-2.5" style={{ fontSize: 13, fontWeight: 500 }} disabled={isLoading || isTyping}>
                                <SlidersHorizontal className="size-3.5" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">{activeFilterCount}</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-68 p-4" sideOffset={6}>
                            <div className="flex items-center justify-between mb-3">
                                <p style={{ fontSize: 13, fontWeight: 600 }}>Advanced filters</p>
                                {activeFilterCount > 0 && (
                                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground px-2" onClick={handleClearFilters}>
                                        <X className="size-3" />Clear
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                                    <DatePicker selected={selectedDueDate} onSelect={(date) => setSelectedDueDate(date)} toDate={new Date()} disabled={isLoading || isTyping} placeholder="Pick due date" className="w-full" />
                                </div>
                                <Separator />
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                                    <Select value={status} onValueChange={(v) => setStatus(v as 'all' | WorkOrderStatus)} disabled={isLoading || isTyping}>
                                        <SelectTrigger className="w-full focus:ring-0"><SelectValue placeholder="Select status" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="thread_opened">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Separator />
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Asset</label>
                                    <Select value={selectedAssetId} onValueChange={(v) => setSelectedAssetId(v ?? '')} disabled={isLoading || isTyping}>
                                        <SelectTrigger className="w-full focus:ring-0"><SelectValue placeholder="Select asset" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Assets</SelectItem>
                                            <Separator className="my-1" />
                                            {assetList.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (!isLoading && !isTyping) handleRefresh(); }} disabled={isLoading || isTyping}>
                                <RefreshCcw className={cn('size-3.5', isLoading && 'animate-spin')} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="end">Refresh</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* ── Stats strip ─────────────────────────────────────────────── */}
            {!isLoading && sortedWorkOrders.length > 0 && (
                <div className="flex-shrink-0 flex items-center gap-0" style={{ borderBottom: '1px solid var(--border-col)' }}>
                    {[
                        { label: 'Overdue', value: counts.overdue, color: counts.overdue > 0 ? 'var(--st-overdue)' : 'var(--text-strong)' },
                        { label: 'Due today', value: counts.today, color: 'var(--text-strong)' },
                        { label: 'Open total', value: sortedWorkOrders.length, color: 'var(--text-strong)' },
                    ].map((s, i) => (
                        <div key={i} className="flex flex-col items-start px-4 py-2.5" style={{ borderRight: '1px solid var(--border-col)', minWidth: 80 }}>
                            <span style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.5px', color: s.color, lineHeight: 1 }}>{s.value}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', marginTop: 3, letterSpacing: '0.2px' }}>{s.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Filter segment tabs ──────────────────────────────────────── */}
            <div className="flex-shrink-0 flex items-center gap-2 px-1 py-2.5 overflow-x-auto" style={{ borderBottom: '1px solid var(--border-col)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--muted-2)', flexShrink: 0, paddingLeft: 2 }}>Queue</span>
                <div className="flex items-center gap-1.5 ml-1">
                    {tabs.map(({ k, label }) => {
                        const active = tabFilter === k;
                        return (
                            <button
                                key={k}
                                onClick={() => setTabFilter(k)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    fontSize: 13, fontWeight: 600,
                                    padding: '5px 12px',
                                    borderRadius: 999,
                                    border: '1px solid',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'background 140ms, color 140ms, border-color 140ms',
                                    background: active ? 'var(--text)' : 'transparent',
                                    color: active ? 'var(--bg)' : 'var(--muted-col)',
                                    borderColor: active ? 'var(--text)' : 'var(--border-col)',
                                }}
                            >
                                {label}
                                <span style={{ opacity: active ? 0.65 : 0.5, fontSize: 11, fontWeight: 700 }}>{counts[k]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Card grid ───────────────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollable" style={{ padding: '14px 4px 24px' }}>
                {isLoading || isTyping || isAssetListLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 content-start px-1">
                        <WorkOrdersSkeleton />
                    </div>
                ) : tabFiltered.length ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 content-start px-1">
                        {tabFiltered.map((workOrder, index) => (
                            <DisplayCard key={`workorder-${workOrder.id}-${index}`} workOrder={workOrder} getStatusLabel={getStatusLabel} />
                        ))}
                    </div>
                ) : (
                    /* Empty state — serif accent per spec §3 */
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ minHeight: 320 }}>
                        <ClipboardListIcon style={{ width: 48, height: 48, color: 'var(--muted-col)', opacity: 0.4 }} strokeWidth={1.1} />
                        <p style={{ fontSize: 18, fontWeight: 300, color: 'var(--text-strong)', letterSpacing: '-0.2px' }}>
                            {tabFilter !== 'all' ? `No ${tabs.find(t => t.k === tabFilter)?.label.toLowerCase()} work orders` : 'No work orders'}
                        </p>
                        <p className="serif" style={{ fontSize: 15, color: 'var(--muted-col)' }}>
                            {tabFilter !== 'all' ? 'Try "All" to see the full queue.' : 'Nothing assigned right now.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}