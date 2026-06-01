'use client';

import { Tags } from '@/lib/streamline-chat-handler';
import { cn } from '@/lib/utils';
import { MessageType } from '@/providers/ChatProvider';
import { Check, ChevronDown, Layers } from 'lucide-react';
import { useRef, useState } from 'react';

export default function ThoughtProcess({ thoughts }: { thoughts: MessageType['reasoning'] }) {
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [maxH, setMaxH] = useState(0);

    const entries =
        thoughts && typeof thoughts === 'object'
            ? (Object.entries(thoughts).filter(([, v]) => v !== null) as [Tags, { title: string; content: string }][])
            : [];

    function handleToggle() {
        if (!isOpen && contentRef.current) setMaxH(contentRef.current.scrollHeight);
        setIsOpen(prev => !prev);
    }

    return (
        <div className="flex flex-col w-full px-2 py-1.5">
            {/* ── Disclosure bar — spec §4 ── */}
            <button
                type="button"
                aria-expanded={isOpen}
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
                {/* spark icon */}
                <Layers
                    size={16}
                    style={{ color: 'var(--muted-col)', flexShrink: 0 }}
                />

                {/* label */}
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.1px' }}>
                    Thought process
                </span>

                {/* summary */}
                {entries.length > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--muted-col)', fontWeight: 500 }}>
                        {entries.length} step{entries.length !== 1 ? 's' : ''}
                    </span>
                )}

                {/* chevron */}
                <ChevronDown
                    size={15}
                    style={{
                        color: 'var(--muted-col)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 220ms ease',
                    }}
                />
            </button>

            {/* ── Collapsible panel ── */}
            <div
                style={{
                    overflow: 'hidden',
                    maxHeight: isOpen ? `${maxH}px` : '0px',
                    opacity: isOpen ? 1 : 0,
                    transition: 'max-height 220ms ease, opacity 180ms ease',
                }}
            >
                <div
                    ref={contentRef}
                    style={{
                        display: 'flex', flexDirection: 'column', gap: 12,
                        padding: '8px 12px',
                        marginLeft: 16,
                        borderLeft: '1px solid var(--border-col)',
                    }}
                >
                    {entries.length > 0 ? (
                        entries.map(([key, value], index) => (
                            <StepItem key={key} step={value} index={index} />
                        ))
                    ) : (
                        <p style={{ fontSize: 13, color: 'var(--muted-col)', fontStyle: 'italic' }}>No steps recorded.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function StepItem({ step, index }: { step: { title: string; content: string }; index: number }) {
    return (
        <div
            className="flex items-start gap-3"
            style={{
                animation: 'step-in 0.3s ease-out forwards',
                animationDelay: `${index * 35}ms`,
                animationFillMode: 'both',
            }}
        >
            {/* Sage check circle — spec uses --st-done for completed steps */}
            <span
                style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--st-done-fill)',
                    border: '1px solid color-mix(in srgb, var(--st-done) 35%, transparent)',
                    marginTop: 1,
                    animation: 'pop-check 0.35s cubic-bezier(.36,.07,.19,.97) forwards',
                    animationDelay: `${index * 35 + 80}ms`,
                    animationFillMode: 'both',
                }}
            >
                <Check size={10} style={{ color: 'var(--st-done)', strokeWidth: 2.5 }} />
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
                {step.title && (
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, marginBottom: step.content ? 2 : 0 }}>
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
