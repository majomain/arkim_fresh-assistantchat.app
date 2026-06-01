"use client";

import { createContext } from "react";

export interface CardState {
    id: string;
    open: boolean;
    minimized: boolean;
}
interface DraggableCardContextType {
    cards: Record<string, CardState>;
    openCard: (id: string) => void;
    closeCard: (id: string) => void;
    toggleMinimize: (id: string) => void;
}

export const DraggableCardContext = createContext<DraggableCardContextType | null>(null);



