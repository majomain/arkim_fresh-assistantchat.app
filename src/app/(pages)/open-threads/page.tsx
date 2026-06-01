'use client'

import { MessageSquare, RefreshCcw, Box, Wrench } from "lucide-react";
import { errorToast } from "@/components/ui/sonner";
import { useLocation } from "@/hooks/use-location";
import messagingService from "@/services/api/messagingService";
import { ThreadDetailList } from "@/types/equipment/thread";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAsset } from "@/hooks/use-asset";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useThreadBroadcast } from "@/hooks/broadcasts/use-thread-broadcast";
import Search from "@/components/core/filters/Search";
import { useDebounce } from "@/hooks/use-debounce";
import DraftsDialog from "./DraftsDialog";

export default function OpenThreadsPage() {
    // asset utils
    const { getAssetFromListById, isAssetListLoading, assetList } = useAsset();
    // location util
    const { selectedLocation } = useLocation();

    const [openThreads, setOpenThreads] = useState<ThreadDetailList>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedAssetId, setSelectedAssetId] = useState<string>('');
    const [search, setSearch] = useState<string>('');
    const debouncedSearch = useDebounce(search, 400);
    const isTyping = search !== debouncedSearch;

    // ─── Clear filters when location changes (synchronous, before effects run) ─
    const prevLocationId = useRef(selectedLocation?.id);
    if (prevLocationId.current !== selectedLocation?.id) {
        prevLocationId.current = selectedLocation?.id;
        setSelectedAssetId('');
        setSearch('');
    }

    // broadcast setup
    const broadcast = useThreadBroadcast((event) => {
        if (event.type === 'THREAD_STATUS_UPDATED') {
            setOpenThreads((prev) => prev.filter((thread) => thread.threadId !== event.threadId));
        }
    });

    // router for redirection
    const router = useRouter();

    // fetch open thread list
    const getOpenThreads = useCallback(async () => {
        try {
            if (selectedLocation) {
                setIsLoading(true);

                const response = await messagingService.getOpenThreads(selectedLocation?.id ?? '', debouncedSearch, selectedAssetId !== 'all' ? selectedAssetId : null);

                setOpenThreads(response);
            }
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [selectedLocation, selectedAssetId, debouncedSearch]);

    useEffect(() => {
        getOpenThreads();
    }, [getOpenThreads]);

    // ── Type filter chips (All / Work orders / Ad-hoc) ──────────────────────
    const [typeFilter, setTypeFilter] = useState<'all' | 'wo' | 'adhoc'>('all');
    const typeFiltered = openThreads.filter(t =>
        typeFilter === 'all' ? true
            : typeFilter === 'wo' ? t.startedFromWorkOrder
                : !t.startedFromWorkOrder,
    );
    const counts = {
        all: openThreads.length,
        wo: openThreads.filter(t => t.startedFromWorkOrder).length,
        adhoc: openThreads.filter(t => !t.startedFromWorkOrder).length,
    };
    const activeCount = openThreads.filter(t => t.isProcessing).length;

    const fmtTime = (iso: string) => {
        const d = new Date(iso);
        const diff = Date.now() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        const days = Math.floor(hrs / 24);
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const typeTabs: { k: typeof typeFilter; label: string }[] = [
        { k: 'all', label: 'All' },
        { k: 'wo', label: 'Work orders' },
        { k: 'adhoc', label: 'Ad-hoc' },
    ];

    return <div className="flex flex-col h-[calc(100dvh-4.5rem)]">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0" style={{ padding: '12px 4px 0', borderBottom: '1px solid var(--border-col)' }}>
            <div className="flex flex-col md:flex-row md:items-start gap-3">
                <div className="flex-1 min-w-0">
                    <p className="eyebrow" style={{ marginBottom: 3 }}>Conversations</p>
                    <h1 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.2px', color: 'var(--text-strong)', lineHeight: 1.2 }}>Threads</h1>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 13, color: 'var(--muted-col)', fontWeight: 500 }}>
                        <span>{openThreads.length} active</span>
                        {activeCount > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--accent-text)' }}>
                                <span className="status-dot" style={{ background: 'var(--accent-col)' }} />
                                {activeCount} processing
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                    <Search search={search} setSearch={setSearch} placeHolder="Search threads" />
                    <DraftsDialog />
                    <Select value={selectedAssetId || 'all'} onValueChange={(v) => setSelectedAssetId(v === 'all' ? '' : v)} disabled={isLoading || isTyping}>
                        <SelectTrigger className="h-8 w-fit focus:ring-0" style={{ fontSize: 13 }}>
                            <SelectValue placeholder="Asset" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Assets</SelectItem>
                            <Separator className="my-1" />
                            {assetList.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (!isLoading && !isTyping) getOpenThreads(); }} disabled={isLoading || isTyping}>
                                <RefreshCcw className={cn('size-3.5', isLoading && 'animate-spin')} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="end">Refresh</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* New-thread bar */}
            <button
                onClick={() => router.push('/assets')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    margin: '12px 0', padding: '11px 14px', borderRadius: 3,
                    background: 'var(--accent-fill)', border: '1px solid var(--accent-line)',
                    cursor: 'pointer', textAlign: 'left',
                }}
            >
                <MessageSquare size={16} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, color: 'var(--muted-col)', fontWeight: 500 }}>Ask Arkim about an asset…</span>
                <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: 3, background: 'var(--accent-col)',
                }}>
                    <Box size={15} style={{ color: 'var(--on-accent)' }} />
                </span>
            </button>

            {/* Type filter chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5">
                {typeTabs.map(({ k, label }) => {
                    const active = typeFilter === k;
                    return (
                        <button
                            key={k}
                            onClick={() => setTypeFilter(k)}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                fontSize: 13, fontWeight: 600, padding: '5px 12px', borderRadius: 999,
                                border: '1px solid', cursor: 'pointer', whiteSpace: 'nowrap',
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

        {/* ── List ───────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollable" style={{ padding: '4px 4px 24px' }}>
            {isLoading || isAssetListLoading || isTyping ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 8 }}>
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 8px' }}>
                            <span className="sk-block" style={{ width: 36, height: 36, borderRadius: 3 }} />
                            <div style={{ flex: 1 }}>
                                <span className="sk-block" style={{ display: 'block', width: '40%', height: 12, marginBottom: 7 }} />
                                <span className="sk-block" style={{ display: 'block', width: '70%', height: 14, marginBottom: 7 }} />
                                <span className="sk-block" style={{ display: 'block', width: '55%', height: 11 }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : typeFiltered.length ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {typeFiltered.map(thread => {
                        const asset = getAssetFromListById(thread.assetId);
                        const isWO = thread.startedFromWorkOrder;
                        return (
                            <button
                                key={thread.threadId}
                                onClick={() => router.push(`/thread/?id=${thread.threadId}`)}
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%',
                                    padding: '12px 10px', textAlign: 'left', cursor: 'pointer',
                                    background: thread.isProcessing ? 'var(--accent-fill)' : 'transparent',
                                    border: 'none', borderBottom: '1px solid var(--border-soft)',
                                    transition: 'background 120ms',
                                }}
                                onMouseEnter={e => { if (!thread.isProcessing) e.currentTarget.style.background = 'var(--surface-2)'; }}
                                onMouseLeave={e => { if (!thread.isProcessing) e.currentTarget.style.background = 'transparent'; }}
                            >
                                {/* type icon */}
                                <span style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    width: 36, height: 36, borderRadius: 3, marginTop: 1,
                                    background: isWO ? 'var(--surface-2)' : 'var(--accent-fill)',
                                    color: isWO ? 'var(--muted-col)' : 'var(--accent-text)',
                                }}>
                                    {isWO ? <Wrench size={17} /> : <MessageSquare size={17} />}
                                </span>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* type chip + asset + time */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                        <span style={{
                                            fontSize: 10.5, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
                                            color: isWO ? 'var(--muted-2)' : 'var(--accent-text)',
                                        }}>
                                            {isWO ? 'Work order' : 'Ad-hoc'}
                                        </span>
                                        {asset && <span style={{ fontSize: 12, color: 'var(--muted-col)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</span>}
                                        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--muted-2)', flexShrink: 0 }}>{fmtTime(thread.createdAtUtc)}</span>
                                    </div>

                                    {/* title */}
                                    <p style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {thread.workOrderTitle ?? thread.title}
                                    </p>

                                    {/* meta line (message count proxy for snippet) */}
                                    <p style={{ fontSize: 12.5, color: 'var(--muted-col)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
                                        {asset?.manufacturer ? ` · ${asset.manufacturer} ${asset.model ?? ''}` : ''}
                                    </p>
                                </div>

                                {/* processing/unread dot */}
                                {thread.isProcessing && (
                                    <span className="status-dot" style={{ background: 'var(--accent-col)', marginTop: 8, flexShrink: 0 }} />
                                )}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="w-full h-full flex flex-col justify-center items-center gap-3" style={{ minHeight: 300 }}>
                    <MessageSquare style={{ width: 44, height: 44, color: 'var(--muted-col)', opacity: 0.4 }} strokeWidth={1.1} />
                    <p style={{ fontSize: 18, fontWeight: 300, color: 'var(--text-strong)' }}>
                        {typeFilter !== 'all' ? `No ${typeTabs.find(t => t.k === typeFilter)?.label.toLowerCase()} threads` : 'No open threads'}
                    </p>
                    <p className="serif" style={{ fontSize: 15, color: 'var(--muted-col)' }}>
                        Closed threads move to the asset’s history.
                    </p>
                </div>
            )}
        </div>
    </div>
}