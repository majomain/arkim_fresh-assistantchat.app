'use client';

import { useDraggableCard } from '@/hooks/use-draggable-card';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';
import { Separator } from './separator';

export default function DraggableCard({
    draggable,
    id,
    title,
    disableClose,
    notify,
    children,
}: {
    draggable: boolean;
    id: string;
    title: string;
    disableClose?: boolean;
    notify?: boolean;
    children: React.ReactNode;
}) {
    const { cards, toggleMinimize, closeCard } = useDraggableCard();
    const state = cards[id];
    const cardRef = useRef<HTMLDivElement>(null);
    const pos = useRef({ offsetX: 0, offsetY: 0 });

    // don't render if card is not created or is closed
    if (!state?.open) return null;

    const minimized = state.minimized;

    // desktop drag logic
    const handleMouseDown = (e: React.MouseEvent) => {
        const card = cardRef.current;
        if (!card) return;

        pos.current.offsetX = e.clientX - card.offsetLeft;
        pos.current.offsetY = e.clientY - card.offsetTop;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        const card = cardRef.current;
        if (!card) return;

        const w = card.offsetWidth;
        const h = card.offsetHeight;

        const newX = e.clientX - pos.current.offsetX;
        const newY = e.clientY - pos.current.offsetY;

        const maxX = window.innerWidth - w;
        const maxY = window.innerHeight - h;

        card.style.left = `${Math.min(Math.max(0, newX), maxX)}px`;
        card.style.top = `${Math.min(Math.max(0, newY), maxY)}px`;
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // mobile drag logic
    const handleTouchStart = (e: React.TouchEvent) => {
        const card = cardRef.current;
        if (!card) return;

        const t = e.touches[0];

        pos.current.offsetX = t.clientX - card.offsetLeft;
        pos.current.offsetY = t.clientY - card.offsetTop;

        document.addEventListener('touchmove', handleTouchMove, {
            passive: false,
        });
        document.addEventListener('touchend', handleTouchEnd);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (e.cancelable) e.preventDefault();

        const card = cardRef.current;
        if (!card) return;

        const t = e.touches[0];

        const w = card.offsetWidth;
        const h = card.offsetHeight;

        const newX = t.clientX - pos.current.offsetX;
        const newY = t.clientY - pos.current.offsetY;

        const maxX = window.innerWidth - w;
        const maxY = window.innerHeight - h;

        card.style.left = `${Math.min(Math.max(0, newX), maxX)}px`;
        card.style.top = `${Math.min(Math.max(0, newY), maxY)}px`;
    };

    const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    };

    return (
        <div
            ref={cardRef}
            onMouseDown={(e) => {
                if (draggable) handleMouseDown(e);
            }}
            onTouchStart={(e) => {
                if (draggable) handleTouchStart(e);
            }}
            className={cn(
                'fixed border bg-card shadow-lg rounded-lg py-3 z-10',
                draggable
                    ? 'cursor-grab'
                    : 'left-1/2 -translate-x-1/2 bottom-0 sm:left-auto sm:translate-none sm:right-1 border-b-0 rounded-b-none',
                minimized ? 'w-60' : 'w-90 sm:w-100 ',
            )}
        >
            {minimized && notify && (
                <span className="absolute -right-1 -top-1 w-1 h-1 p-1.5 bg-primary rounded-full" />
            )}

            <div className="flex flex-col select-none">
                <div className="flex items-center justify-between gap-2 px-3">
                    <span
                        className={cn(
                            'text-sm font-medium',
                            minimized && notify && 'text-primary',
                        )}
                    >
                        {title}
                    </span>

                    <div className="flex">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleMinimize(id);
                            }}
                        >
                            {minimized ? <Maximize2 /> : <Minimize2 />}
                        </Button>

                        {!disableClose && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeCard(id);
                                }}
                            >
                                <X />
                            </Button>
                        )}
                    </div>
                </div>

                {!minimized && <Separator className="mt-3" />}

                {!minimized && (
                    <div className="mt-3 max-h-130 overflow-auto">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
