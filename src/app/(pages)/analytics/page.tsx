'use client';

import { useAsset } from '@/hooks/use-asset';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from '@/hooks/use-location';
import messagingService from '@/services/api/messagingService';
import workOrderService from '@/services/api/workOrderService';
import { ThreadDetailList } from '@/types/equipment/thread';
import { WorkOrderDetailList } from '@/types/workOrder/workOrder';
import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { errorToast } from '@/components/ui/sonner';

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
    const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
    );
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

function inRange(
    dateStr: string | null | undefined,
    r: { start: Date; end: Date },
) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= r.start && d <= r.end;
}

function buildBars(
    workOrders: WorkOrderDetailList,
    period: Period,
    range: { start: Date; end: Date },
) {
    const completed = workOrders.filter(
        (wo) =>
            wo.status === 'completed' &&
            inRange(wo.dueDate ?? wo.createdAtUtc, range),
    );
    if (period === 'week') {
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const counts = new Array(7).fill(0) as number[];
        completed.forEach((wo) => {
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
        buckets.push({
            label: `W${wk}`,
            start: new Date(cursor),
            end: new Date(bEnd),
        });
        cursor.setDate(cursor.getDate() + 7);
        wk++;
    }
    return buckets.map((b) => ({
        label: b.label,
        value: completed.filter((wo) =>
            inRange(wo.dueDate ?? wo.createdAtUtc, b),
        ).length,
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
                workOrderService.getAssignedWorkOrders(
                    new Date(),
                    selectedLocation.id,
                    null,
                    null,
                ),
                messagingService.getThreads(selectedLocation.id),
            ]);
            setWorkOrders(
                woRes.filter(
                    (wo) =>
                        !wo.threadOpenedBy || wo.threadOpenedBy === user?.email,
                ),
            );
            setThreads(thRes);
        } catch (err: any) {
            errorToast({ title: 'Error', description: err.message });
        } finally {
            setIsLoading(false);
        }
    }, [selectedLocation, user?.email]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Derived metrics ───────────────────────────────────────────────────────
    const range = periodRange(period);
    const prev = prevPeriodRange(period);

    const completedInPeriod = workOrders.filter(
        (wo) =>
            wo.status === 'completed' &&
            inRange(wo.dueDate ?? wo.createdAtUtc, range),
    );
    const completedPrevList = workOrders.filter(
        (wo) =>
            wo.status === 'completed' &&
            inRange(wo.dueDate ?? wo.createdAtUtc, prev),
    );
    const completedNow = completedInPeriod.length;
    const completedPrev = completedPrevList.length;
    const heroDelta = completedNow - completedPrev;

    // On-time: finished on or before the due date — uses the work-log completion
    // time when present, otherwise treats a present due date as on-time.
    const isOnTime = (wo: WorkOrderDetailList[number]) => {
        const performed = wo.workLogs?.[wo.workLogs.length - 1]?.performedAtUtc;
        if (performed && wo.dueDate) {
            const due = new Date(
                wo.dueDate.includes('T')
                    ? wo.dueDate
                    : `${wo.dueDate}T00:00:00`,
            );
            due.setHours(23, 59, 59, 999);
            return new Date(performed) <= due;
        }
        return !!wo.dueDate;
    };
    const onTimeRate = (list: WorkOrderDetailList) =>
        list.length > 0
            ? Math.round((list.filter(isOnTime).length / list.length) * 100)
            : null;
    const onTimePct = onTimeRate(completedInPeriod);
    const onTimePctPrev = onTimeRate(completedPrevList);
    const onTimeDelta =
        onTimePct !== null && onTimePctPrev !== null
            ? onTimePct - onTimePctPrev
            : null;

    // Avg. completion time (minutes) from logged downtime.
    const avgMins = (list: WorkOrderDetailList) => {
        const xs = list
            .map((w) => w.downtimeMinutes)
            .filter((n): n is number => typeof n === 'number');
        return xs.length
            ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)
            : null;
    };
    const avgNow = avgMins(completedInPeriod);
    const avgPrev = avgMins(completedPrevList);
    const avgDelta =
        avgNow !== null && avgPrev !== null ? avgNow - avgPrev : null;

    // Questions asked (threads created this period)
    const questionsNow = threads.filter((th) =>
        inRange(th.createdAtUtc, range),
    ).length;
    const questionsPrev = threads.filter((th) =>
        inRange(th.createdAtUtc, prev),
    ).length;
    const questionsDelta = questionsNow - questionsPrev;

    // Bar chart
    const bars = buildBars(workOrders, period, range);
    const maxBar = Math.max(...bars.map((b) => b.value), 1);

    // Most active assets (WOs + threads in period)
    const ranked = assetList
        .map((a) => {
            const n =
                workOrders.filter(
                    (wo) =>
                        wo.assetId === a.id &&
                        inRange(wo.dueDate ?? wo.createdAtUtc, range),
                ).length +
                threads.filter(
                    (th) =>
                        (th as any).assetId === a.id &&
                        inRange(th.createdAtUtc, range),
                ).length;
            return { name: a.name, loc: (a as any).location ?? '', n };
        })
        .filter((a) => a.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 5);
    const maxActivity = Math.max(...ranked.map((a) => a.n), 1);

    const subLabel = period === 'week' ? 'vs. last week' : 'vs. last month';
    const loading = isLoading || isAssetListLoading;

    // ── Skeleton helper ───────────────────────────────────────────────────────
    const Sk = ({ w, h }: { w: number | string; h: number }) => (
        <span
            className="sk-block"
            style={{
                display: 'inline-block',
                width: w,
                height: h,
                borderRadius: 3,
            }}
        />
    );

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100dvh - 4.5rem)',
            }}
        >
            {/* ── Top bar ───────────────────────────────────────────────────── */}
            <div
                style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 4px',
                    borderBottom: '1px solid var(--border-col)',
                }}
            >
                <div style={{ flex: 1 }}>
                    <p
                        style={{
                            fontSize: 18,
                            fontWeight: 600,
                            letterSpacing: '-0.2px',
                            color: 'var(--text-strong)',
                            lineHeight: 1.2,
                        }}
                    >
                        Analytics
                    </p>
                </div>

                {/* Period toggle */}
                <div
                    style={{
                        display: 'flex',
                        gap: 4,
                        background: 'var(--surface-2)',
                        padding: 3,
                        borderRadius: 3,
                    }}
                >
                    {(['week', 'month'] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            style={{
                                fontSize: 12.5,
                                fontWeight: 600,
                                padding: '5px 12px',
                                borderRadius: 2,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'background 140ms, color 140ms',
                                background:
                                    period === p
                                        ? 'var(--surface-hi)'
                                        : 'transparent',
                                color:
                                    period === p
                                        ? 'var(--text)'
                                        : 'var(--muted-col)',
                                boxShadow:
                                    period === p
                                        ? '0 1px 3px rgba(0,0,0,0.12)'
                                        : 'none',
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 3,
                        border: '1px solid var(--border-col)',
                        background: 'transparent',
                        color: 'var(--muted-col)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                    }}
                    title="Refresh"
                >
                    <RefreshCw
                        size={14}
                        className={loading ? 'animate-spin' : ''}
                    />
                </button>
            </div>

            {/* ── Scrollable content ────────────────────────────────────────── */}
            <div
                className="scrollable"
                style={{ flex: 1, overflowY: 'auto', padding: '20px 4px 32px' }}
            >
                {/* ── Metric cards ─────────────────────────────────────────── */}
                <div
                    className="grid grid-cols-2 md:grid-cols-4 gap-2"
                    style={{ marginBottom: 8 }}
                >
                    {[
                        {
                            k: 'Work orders completed',
                            v: loading ? null : completedNow,
                            delta: heroDelta,
                            unit: '',
                            better: 'up' as const,
                            sub: true,
                        },
                        {
                            k: 'On-time rate',
                            v: loading
                                ? null
                                : onTimePct !== null
                                  ? `${onTimePct}%`
                                  : '—',
                            delta: onTimeDelta,
                            unit: '',
                            better: 'up' as const,
                        },
                        {
                            k: 'Avg. complete',
                            v: loading
                                ? null
                                : avgNow !== null
                                  ? `${avgNow}m`
                                  : '—',
                            delta: avgDelta,
                            unit: 'm',
                            better: 'down' as const,
                        },
                        {
                            k: 'Questions asked',
                            v: loading ? null : questionsNow,
                            delta: questionsDelta,
                            unit: '',
                            better: 'up' as const,
                        },
                    ].map((s, i) => {
                        const d = s.delta;
                        const good =
                            d === null || d === 0
                                ? null
                                : s.better === 'up'
                                  ? d > 0
                                  : d < 0;
                        const deltaText =
                            d === null || d === 0
                                ? null
                                : `${d > 0 ? '↑ +' : '↓ '}${d}${s.unit}`;
                        return (
                            <div
                                key={i}
                                style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border-col)',
                                    borderRadius: 3,
                                    padding: '18px 20px',
                                }}
                            >
                                {s.v === null ? (
                                    <Sk w={52} h={36} />
                                ) : (
                                    <p
                                        style={{
                                            fontSize: 34,
                                            fontWeight: 200,
                                            letterSpacing: '-1px',
                                            color: 'var(--text-strong)',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {s.v}
                                    </p>
                                )}
                                <p
                                    style={{
                                        fontSize: 12,
                                        color: 'var(--muted-col)',
                                        marginTop: 8,
                                        fontWeight: 600,
                                    }}
                                >
                                    {s.k}
                                </p>
                                {!loading && deltaText && (
                                    <p
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            fontSize: 11.5,
                                            fontWeight: 600,
                                            marginTop: 6,
                                            color: good
                                                ? 'var(--st-done)'
                                                : 'var(--st-overdue)',
                                        }}
                                    >
                                        <span>{deltaText}</span>
                                        {s.sub && (
                                            <span
                                                style={{
                                                    color: 'var(--muted-col)',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {subLabel}
                                            </span>
                                        )}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Completions + Most active ────────────────────────────── */}
                <div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-2"
                    style={{ marginTop: 8 }}
                >
                    {/* Completions bar chart */}
                    <div
                        style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border-col)',
                            borderRadius: 3,
                            padding: '18px 20px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 8,
                                marginBottom: 14,
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                    color: 'var(--text)',
                                }}
                            >
                                Completions
                            </p>
                            <p
                                style={{
                                    fontSize: 11,
                                    color: 'var(--muted-col)',
                                    fontWeight: 600,
                                }}
                            >
                                {period === 'week' ? 'by day' : 'by week'}
                            </p>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: 6,
                                height: 100,
                            }}
                        >
                            {loading
                                ? bars.map((_, i) => (
                                      <div
                                          key={i}
                                          style={{
                                              flex: 1,
                                              display: 'flex',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              gap: 4,
                                              height: '100%',
                                              justifyContent: 'flex-end',
                                          }}
                                      >
                                          <Sk
                                              w="100%"
                                              h={Math.random() * 50 + 20}
                                          />
                                      </div>
                                  ))
                                : bars.map((b, i) => {
                                      const heightPct =
                                          b.value === 0
                                              ? 2
                                              : Math.max(
                                                    (b.value / maxBar) * 100,
                                                    8,
                                                );
                                      const isPeak =
                                          b.value === maxBar && b.value > 0;
                                      return (
                                          <div
                                              key={i}
                                              style={{
                                                  flex: 1,
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  alignItems: 'center',
                                                  gap: 4,
                                              }}
                                          >
                                              {/* value label */}
                                              <span
                                                  style={{
                                                      fontSize: 11,
                                                      fontWeight: 600,
                                                      color:
                                                          b.value === 0
                                                              ? 'transparent'
                                                              : 'var(--muted-col)',
                                                      lineHeight: 1,
                                                  }}
                                              >
                                                  {b.value}
                                              </span>
                                              {/* bar track */}
                                              <div
                                                  style={{
                                                      width: '100%',
                                                      height: 72,
                                                      display: 'flex',
                                                      alignItems: 'flex-end',
                                                  }}
                                              >
                                                  <div
                                                      style={{
                                                          width: '100%',
                                                          height: `${heightPct}%`,
                                                          borderRadius:
                                                              '2px 2px 0 0',
                                                          background:
                                                              b.value === 0
                                                                  ? 'var(--border-col)'
                                                                  : isPeak
                                                                    ? 'var(--accent-col)'
                                                                    : 'var(--accent-fill-hi)',
                                                          transition:
                                                              'height 550ms cubic-bezier(.3,.9,.3,1)',
                                                      }}
                                                  />
                                              </div>
                                              {/* day label */}
                                              <span
                                                  style={{
                                                      fontSize: 11,
                                                      fontWeight: 600,
                                                      color: 'var(--muted-col)',
                                                      letterSpacing: '0.2px',
                                                  }}
                                              >
                                                  {b.label}
                                              </span>
                                          </div>
                                      );
                                  })}
                        </div>
                    </div>

                    {/* Most active assets */}
                    <div
                        style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border-col)',
                            borderRadius: 3,
                            padding: '18px 20px',
                        }}
                    >
                        <p
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                color: 'var(--text)',
                                marginBottom: 14,
                            }}
                        >
                            Most active assets
                        </p>
                        {loading ? (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 14,
                                }}
                            >
                                {[0, 1, 2, 3].map((i) => (
                                    <Sk key={i} w="100%" h={16} />
                                ))}
                            </div>
                        ) : ranked.length > 0 ? (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                {ranked.map((a, i) => (
                                    <div key={i}>
                                        {i > 0 && (
                                            <div
                                                style={{
                                                    height: 1,
                                                    background:
                                                        'var(--border-soft)',
                                                    margin: '0 0 10px',
                                                }}
                                            />
                                        )}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                paddingBottom: 10,
                                            }}
                                        >
                                            <div
                                                style={{ flex: 1, minWidth: 0 }}
                                            >
                                                <p
                                                    style={{
                                                        fontSize: 13.5,
                                                        fontWeight: 600,
                                                        color: 'var(--text)',
                                                        lineHeight: 1.3,
                                                    }}
                                                >
                                                    {a.name}
                                                </p>
                                                {a.loc && (
                                                    <p
                                                        style={{
                                                            fontSize: 11.5,
                                                            color: 'var(--muted-col)',
                                                            marginTop: 1,
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {a.loc}
                                                    </p>
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    width: 120,
                                                    height: 4,
                                                    background:
                                                        'var(--surface-2)',
                                                    borderRadius: 999,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${(a.n / maxActivity) * 100}%`,
                                                        height: '100%',
                                                        borderRadius: 999,
                                                        background:
                                                            'var(--accent-col)',
                                                    }}
                                                />
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: 'var(--text)',
                                                    minWidth: 20,
                                                    textAlign: 'right',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {a.n}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p
                                className="serif"
                                style={{
                                    fontSize: 14,
                                    color: 'var(--muted-col)',
                                }}
                            >
                                No asset activity in this period.
                            </p>
                        )}
                    </div>
                </div>

                {/* Empty state */}
                {!loading &&
                    completedNow === 0 &&
                    questionsNow === 0 &&
                    ranked.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <p
                                style={{
                                    fontSize: 16,
                                    fontWeight: 300,
                                    color: 'var(--text-strong)',
                                }}
                            >
                                No activity yet
                            </p>
                            <p
                                className="serif"
                                style={{
                                    fontSize: 15,
                                    color: 'var(--muted-col)',
                                    marginTop: 6,
                                }}
                            >
                                Data appears here as work orders complete.
                            </p>
                        </div>
                    )}
            </div>
        </div>
    );
}
