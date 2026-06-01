'use client'

import { DraggableCardContext } from "@/contexts/DraggableCardContext";
import { useContext } from "react";

export function useDraggableCard() {
    const ctx = useContext(DraggableCardContext);
    if (!ctx) throw new Error("useDraggableCard must be used inside DraggableCardProvider");
    return ctx;
}