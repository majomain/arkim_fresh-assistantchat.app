'use client';

import { useThreadBroadcast } from '@/hooks/broadcasts/use-thread-broadcast';
import { useAsset } from '@/hooks/use-asset';
import { useDebounce } from '@/hooks/use-debounce';
import { useLocation } from '@/hooks/use-location';
import messagingService from '@/services/api/messagingService';
import { ThreadDetailList } from '@/types/equipment/thread';
import { Box, MessageSquare, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import RefreshButton from '@/components/core/RefreshButton';
import Search from '@/components/core/filters/Search';
import PageTopBar from '@/components/layout/PageTopBar';
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

import DraftsDialog from './DraftsDialog';

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
            setOpenThreads((prev) =>
                prev.filter((thread) => thread.threadId !== event.threadId),
            );
        }
    });

    // router for redirection
    const router = useRouter();

    // fetch open thread list
    const getOpenThreads = useCallback(async () => {
        try {
            if (selectedLocation) {
                setIsLoading(true);

                const response = await messagingService.getOpenThreads(
                    selectedLocation?.id ?? '',
                    debouncedSearch,
                    selectedAssetId !== 'all' ? selectedAssetId : null,
                );

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
    const typeFiltered = openThreads.filter((t) =>
        typeFilter === 'all'
            ? true
            : typeFilter === 'wo'
              ? t.startedFromWorkOrder
              : !t.startedFromWorkOrder,
    );
    const counts = {
        all: openThreads.length,
        wo: openThreads.filter((t) => t.startedFromWorkOrder).length,
        adhoc: openThreads.filter((t) => !t.startedFromWorkOrder).length,
    };
    const activeCount = openThreads.filter((t) => t.isProcessing).length;

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
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const typeTabs: { k: typeof typeFilter; label: string }[] = [
        { k: 'all', label: 'All' },
        { k: 'wo', label: 'Work orders' },
        { k: 'adhoc', label: 'Ad-hoc' },
    ];

    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100dvh-1.25rem)]">
            <PageTopBar
                title="Threads"
                meta={
                    <p
                        className="type-body"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginTop: 4,
                            color: 'var(--muted-col)',
                            fontWeight: 500,
                        }}
                    >
                        <span>{openThreads.length} active</span>
                        {activeCount > 0 && (
                            <span className="attention-chip">
                                <span
                                    className="status-dot"
                                    style={{
                                        background: 'var(--attention-border)',
                                    }}
                                />
                                {activeCount} processing
                            </span>
                        )}
                    </p>
                }
            />

            {/* New-thread bar */}
            <button
                type="button"
                onClick={() => router.push('/assets')}
                className="surface-attention surface-attention--bar flex w-full items-center gap-2.5 cursor-pointer text-left mx-1"
                style={{ margin: '0 0 12px', padding: '11px 14px' }}
            >
                <span className="attention-icon-chip p-1.5">
                    <MessageSquare size={16} />
                </span>
                <span
                    className="type-body"
                    style={{
                        flex: 1,
                        color: 'var(--text)',
                        fontWeight: 500,
                    }}
                >
                    Ask Arkim about an asset…
                </span>
                <span
                    className="attention-icon-chip attention-icon-chip--solid"
                    style={{ width: 28, height: 28 }}
                >
                    <Box size={15} />
                </span>
            </button>

            {/* Type filter chips + controls */}
            <div className="flex-shrink-0 flex items-center gap-1.5 px-1 py-2.5 overflow-x-auto">
                {typeTabs.map(({ k, label }) => {
                    const active = typeFilter === k;
                    return (
                        <button
                            key={k}
                            onClick={() => setTypeFilter(k)}
                            className={cn(
                                'queue-filter-chip',
                                active && 'tab-chip-active',
                                !active && 'chip-hover-border',
                            )}
                        >
                            {label}
                            <span
                                className="type-micro"
                                style={{
                                    opacity: active ? 0.65 : 0.5,
                                    fontWeight: 700,
                                }}
                            >
                                {counts[k]}
                            </span>
                        </button>
                    );
                })}

                <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                    <Search
                        search={search}
                        setSearch={setSearch}
                        placeHolder="Search threads"
                    />
                    <DraftsDialog />
                    <Select
                        value={selectedAssetId || 'all'}
                        onValueChange={(v) =>
                            setSelectedAssetId(v === 'all' ? '' : v)
                        }
                        disabled={isLoading || isTyping}
                    >
                        <SelectTrigger className="type-body h-8 w-fit focus:ring-0">
                            <SelectValue placeholder="Asset" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Assets</SelectItem>
                            <Separator className="my-1" />
                            {assetList.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                    {a.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <RefreshButton
                        onClick={getOpenThreads}
                        disabled={isTyping}
                        loading={isLoading}
                    />
                </div>
            </div>

            {/* ── List ───────────────────────────────────────────────────────── */}
            <div
                className="flex-1 min-h-0 overflow-y-auto scrollable"
                style={{ padding: '4px 4px 24px' }}
            >
                {isLoading || isAssetListLoading || isTyping ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            paddingTop: 8,
                        }}
                    >
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    gap: 12,
                                    padding: '12px 8px',
                                }}
                            >
                                <span
                                    className="sk-block"
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 3,
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <span
                                        className="sk-block"
                                        style={{
                                            display: 'block',
                                            width: '40%',
                                            height: 12,
                                            marginBottom: 7,
                                        }}
                                    />
                                    <span
                                        className="sk-block"
                                        style={{
                                            display: 'block',
                                            width: '70%',
                                            height: 14,
                                            marginBottom: 7,
                                        }}
                                    />
                                    <span
                                        className="sk-block"
                                        style={{
                                            display: 'block',
                                            width: '55%',
                                            height: 11,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : typeFiltered.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {typeFiltered.map((thread) => {
                            const asset = getAssetFromListById(thread.assetId);
                            const isWO = thread.startedFromWorkOrder;
                            return (
                                <button
                                    key={thread.threadId}
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/thread/?id=${thread.threadId}`,
                                        )
                                    }
                                    className={cn(
                                        'interactive-hover',
                                        thread.isProcessing &&
                                            'list-item-attention',
                                    )}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 12,
                                        width: '100%',
                                        padding: '12px 10px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        border: 'none',
                                        borderBottom:
                                            '1px solid var(--border-soft)',
                                        background: 'transparent',
                                    }}
                                >
                                    {/* type icon */}
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            width: 36,
                                            height: 36,
                                            borderRadius: 3,
                                            marginTop: 1,
                                            background: isWO
                                                ? 'var(--surface-2)'
                                                : 'var(--accent-fill)',
                                            color: isWO
                                                ? 'var(--muted-col)'
                                                : 'var(--accent-text)',
                                        }}
                                    >
                                        {isWO ? (
                                            <Wrench size={17} />
                                        ) : (
                                            <MessageSquare size={17} />
                                        )}
                                    </span>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* type chip + asset + time */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                marginBottom: 3,
                                            }}
                                        >
                                            <span
                                                className="type-micro"
                                                style={{
                                                    fontWeight: 700,
                                                    letterSpacing: '0.4px',
                                                    textTransform: 'uppercase',
                                                    color: isWO
                                                        ? 'var(--muted-2)'
                                                        : 'var(--accent-text)',
                                                }}
                                            >
                                                {isWO ? 'Work order' : 'Ad-hoc'}
                                            </span>
                                            {asset && (
                                                <span
                                                    className="type-small"
                                                    style={{
                                                        color: 'var(--muted-col)',
                                                        fontWeight: 500,
                                                        overflow: 'hidden',
                                                        textOverflow:
                                                            'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {asset.name}
                                                </span>
                                            )}
                                            <span
                                                className="type-small"
                                                style={{
                                                    marginLeft: 'auto',
                                                    color: 'var(--muted-2)',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {fmtTime(thread.createdAtUtc)}
                                            </span>
                                        </div>

                                        {/* title */}
                                        <p
                                            className="type-medium"
                                            style={{
                                                fontWeight: 600,
                                                color: 'var(--text)',
                                                lineHeight: 1.3,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {thread.workOrderTitle ??
                                                thread.title}
                                        </p>

                                        {/* meta line (message count proxy for snippet) */}
                                        <p
                                            className="type-body"
                                            style={{
                                                color: 'var(--muted-col)',
                                                marginTop: 2,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {thread.messageCount} message
                                            {thread.messageCount !== 1
                                                ? 's'
                                                : ''}
                                            {asset?.manufacturer
                                                ? ` · ${asset.manufacturer} ${asset.model ?? ''}`
                                                : ''}
                                        </p>
                                    </div>

                                    {/* processing/unread dot */}
                                    {thread.isProcessing && (
                                        <span
                                            className="status-dot"
                                            style={{
                                                background: 'var(--accent-col)',
                                                marginTop: 8,
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div
                        className="w-full h-full flex flex-col justify-center items-center gap-3"
                        style={{ minHeight: 300 }}
                    >
                        <MessageSquare
                            style={{
                                width: 44,
                                height: 44,
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
                            }}
                        >
                            {typeFilter !== 'all'
                                ? `No ${typeTabs.find((t) => t.k === typeFilter)?.label.toLowerCase()} threads`
                                : 'No open threads'}
                        </p>
                        <p
                            className="serif type-medium"
                            style={{ color: 'var(--muted-col)' }}
                        >
                            Closed threads move to the asset’s history.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
