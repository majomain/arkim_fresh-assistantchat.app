'use client';

import { ProgressType } from '@/lib/streamline-chat-handler';
import ArkimLoader from '@/components/core/ArkimLoader';
import { Check, ChevronDown, Layers } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function StreamTimeline({
    steps,
    hasResponseArrived,
    onClose,
}: {
    steps: ProgressType;
    hasResponseArrived: boolean;
    onClose?: () => void;
}) {
    const [open, setOpen] = useState(true);
    const [visibleCount, setVisibleCount] = useState(0);
    const prevStepCount = useRef(0);

    useEffect(() => {
        if (steps.length > prevStepCount.current) {
            prevStepCount.current = steps.length;
            requestAnimationFrame(() => setVisibleCount(steps.length));
        }
    }, [steps.length]);

    useEffect(() => {
        if (hasResponseArrived) {
            setVisibleCount(steps.length);
            const t = setTimeout(() => setOpen(false), 600);
            return () => clearTimeout(t);
        }
    }, [hasResponseArrived]);

    function handleToggle() {
        const willClose = open;
        setOpen(!open);
        if (willClose) onClose?.();
    }

    const activeStep = steps[steps.length - 1];

    return (
        <div className="flex flex-col w-full px-2 py-1.5">
            {/* ── Live disclosure bar — spec §4 ── */}
            <button
                type="button"
                onClick={handleToggle}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', borderRadius: 3, width: 'fit-content',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    transition: 'background 140ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
                {/* Branded mark loader while streaming, static icon once resolved */}
                {hasResponseArrived
                    ? <Layers size={16} style={{ color: 'var(--muted-col)', flexShrink: 0 }} />
                    : <ArkimLoader size={18} inline />
                }

                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.1px' }}>
                    {hasResponseArrived ? 'Thought process' : 'Thinking…'}
                </span>

                {/* live step label or summary */}
                <span style={{ fontSize: 12, color: 'var(--muted-col)', fontWeight: 500 }}>
                    {hasResponseArrived
                        ? `${steps.length} step${steps.length !== 1 ? 's' : ''}`
                        : activeStep?.title
                            ? activeStep.title.toLowerCase()
                            : `${steps.length} of ?`}
                </span>

                <ChevronDown
                    size={15}
                    style={{
                        color: 'var(--muted-col)',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 220ms ease',
                    }}
                />
            </button>

            {/* ── Collapsible step list ── */}
            {open && (
                <div
                    style={{
                        display: 'flex', flexDirection: 'column', gap: 10,
                        padding: '8px 12px',
                        marginLeft: 16,
                        borderLeft: '1px solid var(--border-col)',
                    }}
                >
                    {steps.length === 0 ? (
                        /* writing animation placeholder while first step arrives */
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {[0, 1, 2].map(i => (
                                <span
                                    key={i}
                                    style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        background: 'var(--muted-col)',
                                        animation: 'thinking-dot 1.2s ease-in-out infinite',
                                        animationDelay: `${i * 0.2}s`,
                                        display: 'inline-block',
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        steps.map((step, index) => {
                            const isDone = index < steps.length - 1 || hasResponseArrived;
                            const isActive = index === steps.length - 1 && !hasResponseArrived;
                            const isVisible = index < visibleCount;
                            return (
                                <LiveStep
                                    key={`${step.step}-${step.tag}-${index}`}
                                    step={step}
                                    isDone={isDone}
                                    isActive={isActive}
                                    isVisible={isVisible}
                                />
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

function LiveStep({
    step,
    isDone,
    isActive,
    isVisible,
}: {
    step: { title: string; content: string };
    isDone: boolean;
    isActive: boolean;
    isVisible: boolean;
}) {
    return (
        <div
            style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                animation: isVisible ? 'step-in 0.3s ease-out forwards' : 'none',
                opacity: isVisible ? undefined : 0,
                willChange: 'opacity, transform',
            }}
        >
            {/* State indicator */}
            {isDone ? (
                /* done = sage check */
                <span
                    style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--st-done-fill)',
                        border: '1px solid color-mix(in srgb, var(--st-done) 35%, transparent)',
                        marginTop: 1,
                        animation: 'pop-check 0.35s cubic-bezier(.36,.07,.19,.97) forwards',
                        animationFillMode: 'both',
                    }}
                >
                    <Check size={10} style={{ color: 'var(--st-done)', strokeWidth: 2.5 }} />
                </span>
            ) : isActive ? (
                /* active = branded mark loader (indeterminate) */
                <span style={{ width: 18, height: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    <ArkimLoader size={16} />
                </span>
            ) : (
                /* pending = dim dot */
                <span
                    style={{
                        width: 18, height: 18, flexShrink: 0, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', marginTop: 1,
                    }}
                >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border-col)', display: 'block' }} />
                </span>
            )}

            <div style={{ flex: 1, minWidth: 0, opacity: isDone ? 1 : isActive ? 1 : 0.45 }}>
                {step.title && (
                    <p style={{
                        fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--text)' : isDone ? 'var(--text)' : 'var(--muted-col)',
                        lineHeight: 1.35, marginBottom: step.content ? 2 : 0,
                    }}>
                        {step.title}
                    </p>
                )}
                {step.content && (
                    <p style={{ fontSize: 13, color: 'var(--muted-col)', lineHeight: 1.5 }}>
                        {step.content}
                    </p>
                )}
            </div>
        </div>
    );
}
