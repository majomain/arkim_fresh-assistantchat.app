'use client'

import { DraftContext, DraftContextType } from "@/contexts/DraftContext"
import { useLocation } from "@/hooks/use-location"
import messagingService from "@/services/api/messagingService"
import { DraftEntry, getAllDrafts, getDraftsByLocation } from "@/utils/draft-mechanism"
import { useEffect, useState } from "react"

const DRAFTS_KEY = 'medeschatdrafts'

export function DraftProvider({ children }: { children: React.ReactNode }) {
    const { selectedLocation } = useLocation()
    const locationId = selectedLocation?.id ?? ''

    const [drafts, setDrafts] = useState<Record<string, DraftEntry>>({})
    const [draftCount, setDraftCount] = useState(0)

    // Refresh drafts — only exposes drafts for the current location
    const refreshDrafts = () => {
        const locationDrafts = getDraftsByLocation(locationId)
        setDrafts(locationDrafts)
        setDraftCount(Object.keys(locationDrafts).length)
    }

    // ─── Write helpers ────────────────────────────────────────────────────────
    // Always write to the full store (all locations), then refresh the view.

    const saveThreadDraft = (threadId: string, entry: DraftEntry) => {
        if (!threadId) return
        try {
            const all = getAllDrafts()
            all[`location:${locationId}thread:${threadId}`] = entry
            localStorage.setItem(DRAFTS_KEY, JSON.stringify(all))
            refreshDrafts()
        } catch { /* ignore */ }
    }

    const saveAssetDraft = (assetId: string, entry: DraftEntry) => {
        if (!assetId) return
        try {
            const all = getAllDrafts()
            all[`location:${locationId}asset:${assetId}`] = entry
            localStorage.setItem(DRAFTS_KEY, JSON.stringify(all))
            refreshDrafts()
        } catch { /* ignore */ }
    }

    // ─── Clear helpers ────────────────────────────────────────────────────────

    const clearThreadDraft = async (threadId: string, deleteAttachments = false) => {
        if (!threadId) return
        try {
            const all = getAllDrafts()
            const key = `location:${locationId}thread:${threadId}`;
            const entry = all[key];
            if (deleteAttachments && entry?.attachmentUrls?.length) {
                await Promise.allSettled(
                    entry.attachmentUrls.map((url) => messagingService.deleteAttachment(url))
                );
            }
            delete all[key];
            localStorage.setItem(DRAFTS_KEY, JSON.stringify(all));
            refreshDrafts();
        } catch { /* ignore */ }
    }

    const clearAssetDraft = async (assetId: string, deleteAttachments = false) => {
        if (!assetId) return
        try {
            const all = getAllDrafts()
            const key = `location:${locationId}asset:${assetId}`;
            const entry = all[key];
            if (deleteAttachments && entry?.attachmentUrls?.length) {
                await Promise.allSettled(
                    entry.attachmentUrls.map((url) => messagingService.deleteAttachment(url))
                );
            }
            delete all[key];
            localStorage.setItem(DRAFTS_KEY, JSON.stringify(all));
            refreshDrafts();
        } catch { /* ignore */ }
    }

    /** Clears ALL drafts for the current location only, leaving other locations intact. */
    const clearAllDrafts = async () => {
        try {
            const all = getAllDrafts()
            const prefix = `location:${locationId}`;
            const locationEntries = Object.entries(all).filter(([key]) => key.startsWith(prefix));
            await Promise.allSettled(
                locationEntries.flatMap(([, entry]) =>
                    (entry.attachmentUrls ?? []).map((url) => messagingService.deleteAttachment(url))
                )
            );
            const remaining = Object.fromEntries(
                Object.entries(all).filter(([key]) => !key.startsWith(prefix))
            );
            localStorage.setItem(DRAFTS_KEY, JSON.stringify(remaining));
            refreshDrafts();
        } catch { /* ignore */ }
    }

    // ─── Read helpers (always read live from localStorage) ───────────────────

    const getThreadDraft = (threadId: string): DraftEntry | null => {
        if (!threadId) return null
        const all = getAllDrafts()
        return all[`location:${locationId}thread:${threadId}`] ?? null
    }

    const getAssetDraft = (assetId: string): DraftEntry | null => {
        if (!assetId) return null
        const all = getAllDrafts()
        return all[`location:${locationId}asset:${assetId}`] ?? null
    }

    // ─── Effects ──────────────────────────────────────────────────────────────

    // Re-scope drafts whenever the selected location changes
    useEffect(() => {
        refreshDrafts()
    }, [locationId])

    // Initial load + cross-tab sync
    useEffect(() => {
        refreshDrafts()

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === DRAFTS_KEY) refreshDrafts()
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    // ─────────────────────────────────────────────────────────────────────────

    const value: DraftContextType = {
        drafts,
        draftCount,
        saveThreadDraft,
        saveAssetDraft,
        clearThreadDraft,
        clearAssetDraft,
        getThreadDraft,
        getAssetDraft,
        clearAllDrafts,
        refreshDrafts,
    }

    return (
        <DraftContext.Provider value={value}>
            {children}
        </DraftContext.Provider>
    )
}