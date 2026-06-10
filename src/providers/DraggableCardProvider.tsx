'use client';

import {
    CardState,
    DraggableCardContext,
} from '@/contexts/DraggableCardContext';
import { useState } from 'react';

export function DraggableCardProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [cards, setCards] = useState<Record<string, CardState>>({});

    const openCard = (id: string) => {
        setCards((prev) => ({
            ...prev,
            [id]: { id, open: true, minimized: false },
        }));
    };

    const closeCard = (id: string) => {
        setCards((prev) => ({
            ...prev,
            [id]: { ...prev[id], open: false },
        }));
    };

    const toggleMinimize = (id: string) => {
        setCards((prev) => ({
            ...prev,
            [id]: { ...prev[id], minimized: !prev[id].minimized },
        }));
    };

    return (
        <DraggableCardContext.Provider
            value={{ cards, openCard, closeCard, toggleMinimize }}
        >
            {children}
        </DraggableCardContext.Provider>
    );
}
