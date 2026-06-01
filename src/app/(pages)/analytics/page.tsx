'use client';

import { useAsset } from '@/hooks/use-asset';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from '@/hooks/use-location';
import messagingService from '@/services/api/messagingService';
import workOrderService from '@/services/api/workOrderService';
import { ThreadDetailList } from '@/types/equipment/thread';
import { WorkOrderDetailList } from '@/types/workOrder/workOrder';
import { errorToast } from '@/components/ui/sonner';
import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// ── Period helpers ────────────────────────────────────────────────────────────

type Period = 'week' | 'month';

function periodRange(p: Period) {
    const now = new Date();
    if (p === 'week') {
        const isoDay = (now.getDay() + 6) % 7; // Mon = 0
        const start = new Date(now);
        start.setDate(now.getDate() - isoDay);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

function prevPeriodRange(p: Period) {
    const now = new Date();
    if (p === 'week') {
        const isoDay = (now.getDay() + 6) % 7;
        const end = new Date(now);
        end.setDate(now.getDate() - isoDay - 1);
        end.setHours(23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { start, end };
    }
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end };
}

function inRange(dateStr: string | null | undefined, r: { start: Date; end: Date }) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= r.start && d <= r.end;
}

function buildBars(workOrders: WorkOrderDetailList, period: Period, range: { start: Date; end: Date }) {
    const completed = workOrders.filter(
        wo => wo.status === 'completed' && inRange(wo.dueDate ?? wo.createdAtUtc, range),
    );
    if (period === 'week') {
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const counts = new Array(7).fill(0) as number[];
        completed.forEach(wo => {
            const d = new Date((wo.dueDate ?? wo.createdAtUtc) as string);
            counts[(d.getDay() + 6) % 7]++;
        });
        return labels.map((label, i) => ({ label, value: counts[i] }));
    }
    // month → 4–5 weekly buckets
    const buckets: { label: string; start: Date; end: Date }[] = [];
    let cursor = new Date(range.start);
    let wk = 1;
    while (cursor <= range.end) {
        const bEnd = new Date(cursor);
        bEnd.setDate(cursor.getDate() + 6);
        if (bEnd > range.end) bEnd.setTime(range.end.getTime());
        buckets.push({ label: `W${wk}`, start: new Date(cursor), end: new Date(bEnd) });
        cursor.setDate(cursor.getDate() + 7);
        wk++;
    }
    return buckets.map(b => ({
        label: b.label,
        value: completed.filter(wo => inRange(wo.dueDate ?? wo.createdAtUtc, b)).length,
    }));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const { user } = useAuth();
    const { assetList, isAssetListLoading } = useAsset();
    const { selectedLocation } = useLocation();
    const [period, setPeriod] = useState<Period>('week');
    const [workOrders, setWorkOrders] = useState<WorkOrderDetailList>([]);
    const [threads, setThreads] = useState<ThreadDetailList>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!selectedLocation) return;
        setIsLoading(true);
        try {
            const [woRes, thRes] = await Promise.all([
                workOrderService.getAssignedWorkOrders(new Date(), selectedLocation.id, null, null),
                messagingService.getThreads(selectedLocation.id),
            ]);
            setWorkOrders(woRes.filter(wo => !wo.threadOpenedBy || wo.threadOpenedBy === user?.email));
            setThreads(thRes);
        } catch (err: any) {
            errorToast({ title: 'Error', description: err.message });
        } finally {
            setIsLoading(false);
        }
    }, [selectedLocation, user?.email]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Derived metrics ───────────────────────────────────────────────────────
    const range = periodRange(period);
    const prev  = prevPeriodRange(period);

    const completedNow  = workOrders.filter(wo => wo.status === 'completed' && inRange(wo.dueDate ?? wo.createdAtUtc, range)).length;
    const completedPrev = workOrders.filter(wo => wo.status === 'completed' && inRange(wo.dueDate ?? wo.createdAtUtc, prev)).length;
    const heroDelta = completedNow - completedPrev;

    // On-time: completed WOs where due date wasn't in the past when completed (proxy: dueDate present)
    const completedInPeriod = workOrders.filter(wo => wo.status === 'completed' && inRange(wo.dueDate ?? wo.createdAtUtc, range));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const onTimePct = completedInPeriod.length > 0
        ? Math.round(completedInPeriod.filter(wo => wo.dueDate && new Date(wo.dueDate) >= today).length / completedInPeriod.length * 100)
        : null;

    // Questions asked (threads created this period)
    const questionsNow  = threads.filter(th => inRange(th.createdAtUtc, range)).length;
    const questionsPrev = threads.filter(th => inRange(th.createdAtUtc, prev)).length;
    const questionsDelta = questionsNow - questionsPrev;

    // Bar chart
    const bars = buildBars(workOrders, period, range);
    const maxBar = Math.max(...bars.map(b => b.value), 1);

    // Most active assets (WOs + threads in period)
    const ranked = assetList
        .map(a => {
            const n = workOrders.filter(wo => wo.assetId === a.id && inRange(wo.dueDate ?? wo.createdAtUtc, range)).length
                    + threads.filter(th => (th as any).assetId === a.id && inRange(th.createdAtUtc, range)).length;
            return { name: a.name, loc: (a as any).location ?? '', n };
        })
        .filter(a => a.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 5);
    const maxActivity = Math.max(...ranked.map(a => a.n), 1);

    const subLabel = period === 'week' ? 'vs. last week' : 'vs. last month';
    const loading = isLoading || isAssetListLoading;

    // ── Skeleton helper ───────────────────────────────────────────────────────
    const Sk = ({ w, h }: { w: number | string; h: number }) => (
        <span className="sk-block" style={{ display: 'inline-block', width: w, height: h, borderRadius: 3 }} />
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 4.5rem)' }}>

            {/* ── Top bar ───────────────────────────────────────────────────── */}
            <div style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 4px', borderBottom: '1px solid var(--border-col)',
            }}>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.2px', color: 'var(--text-strong)', lineHeight: 1.2 }}>Analytics</p>
                </div>

                {/* Period toggle */}
                <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 3, borderRadius: 3 }}>
                    {(['week', 'month'] as Period[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            style={{
                                fontSize: 12.5, fontWeight: 600, padding: '5px 12px', borderRadius: 2,
                                border: 'none', cursor: 'pointer', transition: 'background 140ms, color 140ms',
                                background: period === p ? 'var(--surface-hi)' : 'transparent',
                                color: period === p ? 'var(--text)' : 'var(--muted-col)',
                                boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                            }}
                        >
                            {p === 'week' ? 'This week' : 'This month'}
                        </button>
                    ))}
                </div>

                {/* Refresh */}
                <button
                    onClick={fetchData}
                    disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: 3,
                        border: '1px solid var(--border-col)', background: 'transparent',
                        color: 'var(--muted-col)', cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                    }}
                    title="Refresh"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* ── Scrollable content ────────────────────────────────────────── */}
            <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '20px 4px 32px' }}>

                {/* Hero metric */}
                <div style={{
                    position: 'relative', overflow: 'hidden',
                    background: 'var(--surface)', border: '1px solid var(--border-col)',
                    borderRadius: 3, padding: '24px 28px 22px', marginBottom: 12,
                }}>
                    {/* faint mark watermark */}
                    <img
                        src="/assets/loader/arkim-mark.png"
                        alt=""
                        style={{
                            position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                            width: 80, height: 80, opacity: 0.06, pointerEvents: 'none', userSelect: 'none',
                        }}
                    />
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--muted-col)', marginBottom: 10 }}>
                        {period === 'week' ? 'This week' : 'This month'}
                    </p>
                    {loading
                        ? <Sk w={64} h={52} />
                        : <p style={{ fontSize: 56, fontWeight: 200, letterSpacing: '-2px', color: 'var(--text-strong)', lineHeight: 1 }}>
                            {completedNow}
                          </p>
                    }
                    <p style={{ fontSize: 14, color: 'var(--muted-col)', marginTop: 6, fontWeight: 500 }}>
                        Work orders completed
                    </p>
                    {!loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                            {heroDelta !== 0 && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 3,
                                    fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                                    background: heroDelta > 0 ? 'var(--st-done-fill)' : 'var(--st-overdue-fill)',
                                    color: heroDelta > 0 ? 'var(--st-done)' : 'var(--st-overdue)',
                                }}>
                                    {heroDelta > 0 ? '↑' : '↓'} {heroDelta > 0 ? `+${heroDelta}` : heroDelta}
                                </span>
                            )}
                            <span style={{ fontSize: 12, color: 'var(--muted-col)' }}>{subLabel}</span>
                        </div>
                    )}
                </div>

                {/* Stat trio */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
                    {[
                        {
                            k: 'On-time rate',
                            v: loading ? null : onTimePct !== null ? `${onTimePct}%` : '—',
                            delta: null, dir: 'flat' as const,
                        },
                        {
                            k: 'Questions asked',
                            v: loading ? null : questionsNow,
                            delta: questionsDelta, dir: questionsDelta >= 0 ? 'up' as const : 'flat' as const,
                        },
                        {
                            k: 'Open WOs',
                            v: loading ? null : workOrders.filter(wo => wo.status === 'open').length,
                            delta: null, dir: 'flat' as const,
                        },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: 'var(--surface)', border: '1px solid var(--border-col)',
                            borderRadius: 3, padding: '16px 18px',
                        }}>
                            {s.v === null
                                ? <Sk w={40} h={22} />
                                : <p style={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.5px', color: 'var(--text-strong)', lineHeight: 1 }}>{s.v}</p>
                            }
                            <p style={{ fontSize: 11.5, color: 'var(--muted-col)', marginTop: 5, fontWeight: 600 }}>{s.k}</p>
                            {s.delta !== null && s.delta !== 0 && (
                                <p style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 3,
                                    fontSize: 11, fontWeight: 600, marginTop: 5,
                                    color: s.dir === 'up' ? 'var(--st-done)' : 'var(--muted-col)',
                                }}>
                                    {s.dir === 'up' && '↑'} {s.delta > 0 ? `+${s.delta}` : s.delta}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Completions bar chart */}
                <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)' }}>Completions</p>
                        <p style={{ fontSize: 11, color: 'var(--muted-col)', fontWeight: 600 }}>{period === 'week' ? 'by day' : 'by week'}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
                        {loading
                            ? bars.map((_, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                                    <Sk w="100%" h={Math.random() * 50 + 20} />
                                </div>
                            ))
                            : bars.map((b, i) => {
                                const heightPct = b.value === 0 ? 2 : Math.max(b.value / maxBar * 100, 8);
                                const isPeak = b.value === maxBar && b.value > 0;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        {/* value label */}
                                        <span style={{ fontSize: 11, fontWeight: 600, color: b.value === 0 ? 'transparent' : 'var(--muted-col)', lineHeight: 1 }}>
                                            {b.value}
                                        </span>
                                        {/* bar track */}
                                        <div style={{ width: '100%', height: 72, display: 'flex', alignItems: 'flex-end' }}>
                                            <div style={{
                                                width: '100%',
                                                height: `${heightPct}%`,
                                                borderRadius: '2px 2px 0 0',
                                                background: b.value === 0
                                                    ? 'var(--border-col)'
                                                    : isPeak
                                                        ? 'var(--accent-col)'
                                                        : 'var(--accent-fill-hi)',
                                                transition: 'height 550ms cubic-bezier(.3,.9,.3,1)',
                                            }} />
                                        </div>
                                        {/* day label */}
                                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-col)', letterSpacing: '0.2px' }}>
                                            {b.label}
                                        </span>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

                {/* Most active assets */}
                {!loading && ranked.length > 0 && (
                    <div style={{ marginTop: 28 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 14 }}>
                            Most active assets
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {ranked.map((a, i) => (
                                <div key={i}>
                                    {i > 0 && <div style={{ height: 1, background: 'var(--border-soft)', margin: '0 0 10px' }} />}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 10 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{a.name}</p>
                                            {a.loc && <p style={{ fontSize: 11.5, color: 'var(--muted-col)', marginTop: 1, fontWeight: 500 }}>{a.loc}</p>}
                                        </div>
                                        <div style={{ width: 120, height: 4, background: 'var(--surface-2)', borderRadius: 999, flexShrink: 0 }}>
                                            <div style={{
                                                width: `${a.n / maxActivity * 100}%`,
                                                height: '100%', borderRadius: 999,
                                                background: 'var(--accent-col)',
                                            }} />
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', minWidth: 20, textAlign: 'right', flexShrink: 0 }}>
                                            {a.n}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!loading && completedNow === 0 && questionsNow === 0 && ranked.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <p style={{ fontSize: 16, fontWeight: 300, color: 'var(--text-strong)' }}>No activity yet</p>
                        <p className="serif" style={{ fontSize: 15, color: 'var(--muted-col)', marginTop: 6 }}>
                            Data appears here as work orders complete.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
