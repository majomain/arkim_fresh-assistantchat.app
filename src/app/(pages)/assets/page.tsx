'use client';

import { useAsset } from '@/hooks/use-asset';
import { useLocation } from '@/hooks/use-location';
import { AssetWithThreads } from '@/types/equipment/asset';
import {
    Box,
    ChevronRight,
    MapPin,
    MessageSquareText,
    RefreshCw,
    Search as SearchIcon,
    X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

// Health derivation — real backend status maps here; default healthy.
function assetHealth(a: AssetWithThreads): { color: string; label: string } {
    if (a.archived) return { color: 'var(--st-cancel)', label: 'Archived' };
    // status: numeric from backend; treat falsy/0 as healthy, else attention
    const openThreads = (a.threads ?? []).filter(
        (t) => t.status === 'open',
    ).length;
    if (openThreads > 0)
        return { color: 'var(--st-open)', label: 'Active threads' };
    return { color: 'var(--st-done)', label: 'Healthy' };
}

export default function AssetsListPage() {
    const { assetList, isAssetListLoading, refreshAssetList } = useAsset();
    const { selectedLocation } = useLocation();
    const router = useRouter();
    const [q, setQ] = useState('');

    const needle = q.trim().toLowerCase();
    const match = (a: AssetWithThreads) =>
        !needle ||
        [a.name, a.manufacturer, a.type, a.location]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(needle);

    const visible = useMemo(
        () => assetList.filter((a) => !a.archived && match(a)),
        [assetList, needle],
    );

    // Group by location
    const groups = useMemo(() => {
        const map = new Map<string, AssetWithThreads[]>();
        visible.forEach((a) => {
            const loc = a.location?.trim() || 'Unassigned';
            if (!map.has(loc)) map.set(loc, []);
            map.get(loc)!.push(a);
        });
        return Array.from(map.entries()).sort((a, b) =>
            a[0].localeCompare(b[0]),
        );
    }, [visible]);

    const total = visible.length;
    const attention = visible.filter(
        (a) => assetHealth(a).color === 'var(--st-open)',
    ).length;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100dvh - 4.5rem)',
            }}
        >
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div
                style={{
                    flexShrink: 0,
                    padding: '12px 4px 14px',
                    borderBottom: '1px solid var(--border-col)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                    }}
                >
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="eyebrow" style={{ marginBottom: 3 }}>
                            Asset registry
                        </p>
                        <p
                            style={{
                                fontSize: 18,
                                fontWeight: 600,
                                letterSpacing: '-0.2px',
                                color: 'var(--text-strong)',
                                lineHeight: 1.2,
                            }}
                        >
                            Assets
                        </p>
                    </div>
                    <button
                        onClick={() =>
                            !isAssetListLoading && refreshAssetList()
                        }
                        disabled={isAssetListLoading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 3,
                            flexShrink: 0,
                            border: '1px solid var(--border-col)',
                            background: 'transparent',
                            color: 'var(--muted-col)',
                            cursor: isAssetListLoading
                                ? 'not-allowed'
                                : 'pointer',
                        }}
                        title="Refresh assets"
                    >
                        <RefreshCw
                            size={14}
                            className={isAssetListLoading ? 'animate-spin' : ''}
                        />
                    </button>
                </div>

                {/* sub line */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginTop: 8,
                        fontSize: 13,
                        color: 'var(--muted-col)',
                        fontWeight: 500,
                    }}
                >
                    <span>
                        {total} assets · {selectedLocation?.name ?? 'All sites'}
                    </span>
                    {attention > 0 && (
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                color: 'var(--st-open)',
                            }}
                        >
                            <span
                                className="status-dot"
                                style={{ background: 'var(--st-open)' }}
                            />
                            {attention} need attention
                        </span>
                    )}
                </div>

                {/* search */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 12,
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border-col)',
                        borderRadius: 3,
                        padding: '8px 12px',
                    }}
                >
                    <SearchIcon
                        size={16}
                        style={{ color: 'var(--muted-col)', flexShrink: 0 }}
                    />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search assets, make or location…"
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 14,
                            color: 'var(--text)',
                        }}
                    />
                    {q && (
                        <button
                            onClick={() => setQ('')}
                            style={{
                                display: 'flex',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--muted-col)',
                            }}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── List ─────────────────────────────────────────────────────── */}
            <div
                className="scrollable"
                style={{ flex: 1, overflowY: 'auto', padding: '8px 4px 24px' }}
            >
                {isAssetListLoading ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            padding: '8px 0',
                        }}
                    >
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
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
                                            width: '50%',
                                            height: 14,
                                            marginBottom: 6,
                                        }}
                                    />
                                    <span
                                        className="sk-block"
                                        style={{
                                            display: 'block',
                                            width: '32%',
                                            height: 11,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                        <p
                            className="serif"
                            style={{
                                fontSize: 17,
                                color: 'var(--text-strong)',
                            }}
                        >
                            {needle
                                ? `No assets match “${q}.”`
                                : 'No assets on this site yet.'}
                        </p>
                        <p
                            style={{
                                fontSize: 13,
                                color: 'var(--muted-col)',
                                marginTop: 6,
                            }}
                        >
                            {needle
                                ? 'Try a different name, make or location.'
                                : 'Onboard an asset to get started.'}
                        </p>
                    </div>
                ) : (
                    groups.map(([loc, items]) => (
                        <div key={loc} style={{ marginBottom: 4 }}>
                            {/* group header */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '12px 8px 6px',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: '0.6px',
                                    textTransform: 'uppercase',
                                    color: 'var(--muted-2)',
                                }}
                            >
                                <MapPin
                                    size={12}
                                    style={{ color: 'var(--muted-2)' }}
                                />
                                {loc}
                                <span
                                    style={{
                                        color: 'var(--muted-2)',
                                        opacity: 0.7,
                                        fontWeight: 600,
                                    }}
                                >
                                    {items.length}
                                </span>
                            </div>

                            {/* rows */}
                            {items.map((a) => {
                                const health = assetHealth(a);
                                const openThreads = (a.threads ?? []).filter(
                                    (t) => t.status === 'open',
                                ).length;
                                return (
                                    <button
                                        key={a.id}
                                        type="button"
                                        onClick={() =>
                                            router.push(`/asset?id=${a.id}`)
                                        }
                                        className="interactive-hover"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            width: '100%',
                                            padding: '11px 8px',
                                            background: 'transparent',
                                            border: 'none',
                                            borderBottom:
                                                '1px solid var(--border-soft)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
                                    >
                                        {/* toolbox icon + health dot */}
                                        <span
                                            style={{
                                                position: 'relative',
                                                flexShrink: 0,
                                                width: 38,
                                                height: 38,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'var(--surface-2)',
                                                borderRadius: 3,
                                            }}
                                        >
                                            <Box
                                                size={19}
                                                style={{
                                                    color: 'var(--muted-col)',
                                                }}
                                            />
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    top: -2,
                                                    right: -2,
                                                    width: 9,
                                                    height: 9,
                                                    borderRadius: '50%',
                                                    background: health.color,
                                                    border: '2px solid var(--bg)',
                                                }}
                                            />
                                        </span>

                                        {/* name + meta */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: 'var(--text)',
                                                    lineHeight: 1.3,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {a.name}
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: 12,
                                                    color: 'var(--muted-col)',
                                                    marginTop: 1,
                                                    fontWeight: 500,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {[a.manufacturer, a.type]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </p>
                                        </div>

                                        {/* activity badge */}
                                        {openThreads > 0 && (
                                            <span
                                                className="attention-chip"
                                                title="Open threads"
                                            >
                                                <MessageSquareText size={12} />
                                                {openThreads}
                                            </span>
                                        )}

                                        <ChevronRight
                                            size={16}
                                            style={{
                                                color: 'var(--muted-2)',
                                                flexShrink: 0,
                                            }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
