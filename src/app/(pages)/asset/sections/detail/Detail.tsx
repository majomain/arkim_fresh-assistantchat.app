'use client';

import { useAsset } from '@/hooks/use-asset';
import { Box, Layers, MapPin, Wrench } from 'lucide-react';

import TextArea from '@/components/core/chat/TextArea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { buildLogosPath } from '@/utils/assets';

// Health derivation — backend status maps here; default healthy.
function deriveHealth(asset: ReturnType<typeof useAsset>['currentAsset']) {
    if (!asset)
        return {
            color: 'var(--st-done)',
            label: 'Healthy',
            note: 'On schedule',
        };
    if (asset.archived)
        return {
            color: 'var(--st-cancel)',
            label: 'Archived',
            note: 'Out of service',
        };
    const openThreads = (asset.threads ?? []).filter(
        (t) => t.status === 'open',
    ).length;
    if (openThreads > 0)
        return {
            color: 'var(--st-open)',
            label: 'Attention',
            note: 'Active threads',
        };
    return { color: 'var(--st-done)', label: 'Healthy', note: 'On schedule' };
}

// Plain-language descriptor by asset type
function descriptorFor(type?: string | null, fallback?: string | null): string {
    if (fallback) return fallback;
    const map: Record<string, string> = {
        Conveyor: 'Belt transfer · pneumatic',
        Filler: 'Rotary piston filler',
        Capper: 'Inline screw capper',
        Boiler: 'Steam · low-pressure',
        Washer: 'Tunnel tray washer',
        Compressor: 'Rotary-screw · variable speed',
        Pump: 'Centrifugal · inline',
    };
    return (type && map[type]) || type || 'Industrial asset';
}

export default function Detail() {
    const { currentAsset, isAssetLoading } = useAsset();

    function getImageUrl() {
        let imageUrl = buildLogosPath('arkim.webp');
        if (
            currentAsset?.manufacturer === 'fs curtis' &&
            currentAsset?.model === 'nx4'
        )
            imageUrl = '/nx4-profile.jpg';
        else if (
            currentAsset?.manufacturer === 'Quincy Compressor' &&
            currentAsset?.model === 'QGS20'
        )
            imageUrl = '/quincy-profile.jpg';
        else if (
            currentAsset?.manufacturer === 'Champion' &&
            currentAsset?.model === 'D10'
        )
            imageUrl = '/champion-profile.jpg';
        else if (
            currentAsset?.manufacturer === 'Kaishan' &&
            currentAsset?.model === 'KRSL30'
        )
            imageUrl = '/kaishan-profile.jpg';
        return imageUrl;
    }

    if (isAssetLoading) {
        return (
            <div className="w-full max-w-3xl flex flex-col gap-4">
                <Skeleton className="w-full h-56 rounded-[3px]" />
                <Skeleton className="w-2/3 h-10 rounded-[3px]" />
                <div className="flex gap-2">
                    <Skeleton className="w-24 h-7 rounded-[3px]" />
                    <Skeleton className="w-24 h-7 rounded-[3px]" />
                </div>
                <Skeleton className="w-full h-20 rounded-[3px]" />
            </div>
        );
    }

    const a = currentAsset;
    const health = deriveHealth(a);
    const descriptor = descriptorFor(a?.type, a?.description);
    const openThreads = (a?.threads ?? []).filter(
        (t) => t.status === 'open',
    ).length;
    const lastService = a?.lastMaintenance
        ? new Date(a.lastMaintenance).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
          })
        : '—';

    return (
        <div className="w-full max-w-3xl flex flex-col gap-5">
            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* photo */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16 / 9',
                        maxHeight: 260,
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '1px solid var(--border-col)',
                        background: 'var(--surface-2)',
                    }}
                >
                    <img
                        src={getImageUrl()}
                        alt={a?.name ?? 'Asset'}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                    {/* health badge overlay */}
                    <span
                        className="type-micro"
                        style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontWeight: 600,
                            letterSpacing: '0.3px',
                            padding: '4px 10px',
                            borderRadius: 999,
                            background: 'var(--surface)',
                            border: '1px solid var(--border-col)',
                            color: health.color,
                        }}
                    >
                        <span
                            className="status-dot"
                            style={{ background: health.color }}
                        />
                        {health.label}
                    </span>
                </div>

                {/* name + descriptor + chips */}
                <div>
                    <p
                        className="type-hero"
                        style={{
                            fontWeight: 300,
                            letterSpacing: '-0.4px',
                            color: 'var(--text-strong)',
                            lineHeight: 1.1,
                        }}
                    >
                        {a?.name}
                    </p>
                    <p
                        className="serif type-lead"
                        style={{
                            color: 'var(--muted-col)',
                            marginTop: 4,
                        }}
                    >
                        {descriptor}
                    </p>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginTop: 12,
                        }}
                    >
                        {a?.manufacturer && (
                            <span className="chip">
                                <Wrench size={12} />
                                {a.manufacturer}
                            </span>
                        )}
                        {a?.model && <span className="chip">{a.model}</span>}
                        {a?.location && (
                            <span className="chip">
                                <MapPin size={12} />
                                {a.location}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Asset-state strip ────────────────────────────────────────── */}
            <div
                style={{
                    display: 'flex',
                    border: '1px solid var(--border-col)',
                    borderRadius: 3,
                    background: 'var(--surface)',
                    overflow: 'hidden',
                }}
            >
                {[
                    {
                        lbl: 'Health',
                        val: health.label,
                        sub: health.note,
                        dot: health.color,
                    },
                    {
                        lbl: 'Open threads',
                        val: String(openThreads),
                        sub:
                            openThreads === 1
                                ? '1 active'
                                : `${openThreads} active`,
                    },
                    {
                        lbl: 'Last service',
                        val: lastService,
                        sub: a?.serialNumber ? `SN ${a.serialNumber}` : '—',
                    },
                ].map((cell, i) => (
                    <div
                        key={i}
                        style={{
                            flex: 1,
                            padding: '12px 14px',
                            borderRight:
                                i < 2 ? '1px solid var(--border-soft)' : 'none',
                        }}
                    >
                        <p
                            className="type-micro"
                            style={{
                                fontWeight: 600,
                                color: 'var(--muted-2)',
                                letterSpacing: '0.3px',
                            }}
                        >
                            {cell.lbl}
                        </p>
                        <p
                            className="type-medium"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontWeight: 600,
                                color: 'var(--text)',
                                marginTop: 4,
                            }}
                        >
                            {cell.dot && (
                                <span
                                    className="status-dot"
                                    style={{ background: cell.dot }}
                                />
                            )}
                            {cell.val}
                        </p>
                        <p
                            className="type-small"
                            style={{
                                color: 'var(--muted-col)',
                                marginTop: 2,
                            }}
                        >
                            {cell.sub}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Reserved baseline-summary slot (design only) ─────────────── */}
            <div
                style={{
                    border: '1px dashed var(--border-col)',
                    borderRadius: 3,
                    background: 'var(--surface-2)',
                    padding: '16px 18px',
                    position: 'relative',
                }}
            >
                <Badge
                    variant="attention"
                    className="absolute top-3.5 right-4 text-[10px] uppercase tracking-wider"
                >
                    In development
                </Badge>
                <p
                    className="type-micro"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        fontWeight: 700,
                        letterSpacing: '0.8px',
                        textTransform: 'uppercase',
                        color: 'var(--muted-col)',
                    }}
                >
                    <Layers size={14} style={{ color: 'var(--muted-col)' }} />
                    Baseline summary
                </p>
                <p
                    className="serif type-title"
                    style={{
                        color: 'var(--muted-col)',
                        marginTop: 8,
                    }}
                >
                    A plain-language health baseline for this asset will live
                    here.
                </p>
                <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
                    {['Last baseline', 'Confidence', 'Drift'].map((k) => (
                        <div key={k}>
                            <p
                                className="type-lead"
                                style={{
                                    fontWeight: 300,
                                    color: 'var(--muted-2)',
                                }}
                            >
                                —
                            </p>
                            <p
                                className="type-micro"
                                style={{
                                    color: 'var(--muted-2)',
                                    fontWeight: 600,
                                    marginTop: 2,
                                }}
                            >
                                {k}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Ad-hoc chat bar ──────────────────────────────────────────── */}
            <div
                className="surface-attention surface-attention--bar"
                style={{ padding: '14px 16px' }}
            >
                <p
                    className="type-small"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        fontWeight: 600,
                        color: 'var(--attention-text)',
                        marginBottom: 10,
                    }}
                >
                    <Box size={13} />
                    Ask about this asset
                </p>
                <TextArea assetTitle={a?.name} />
            </div>
        </div>
    );
}
