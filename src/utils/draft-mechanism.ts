'use client'

import messagingService from "@/services/api/messagingService";

export const DRAFTS_KEY = 'medeschatdrafts';

export type DraftEntry = {
    title: string;
    assetId?: string;
    text: string;
    attachmentUrls: string[];
};

/** Returns ALL drafts from localStorage (all locations). */
export function getAllDrafts(): Record<string, DraftEntry> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(DRAFTS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

/** Returns only the drafts that belong to the given locationId. */
export function getDraftsByLocation(locationId: string): Record<string, DraftEntry> {
    const all = getAllDrafts();
    const prefix = `location:${locationId}`;
    return Object.fromEntries(
        Object.entries(all).filter(([key]) => key.startsWith(prefix))
    );
}

/** Deletes all attachment URLs from a draft entry via the API (best-effort). */
async function deleteAttachmentsForEntry(entry: DraftEntry): Promise<void> {
    if (!entry.attachmentUrls?.length) return;
    await Promise.allSettled(
        entry.attachmentUrls.map((url) => messagingService.deleteAttachment(url))
    );
}


export async function clearAllDraft() {
    if (typeof window === 'undefined') return;
    const all = getAllDrafts();
    await Promise.allSettled(
        Object.values(all).map((entry) => deleteAttachmentsForEntry(entry))
    );
    localStorage.removeItem(DRAFTS_KEY);
}

export async function clearDraftByThread(locationId: string, threadId: string) {
    if (!threadId) return;
    try {
        const drafts = getAllDrafts();
        const key = `location:${locationId}thread:${threadId}`;
        const entry = drafts[key];
        if (entry) await deleteAttachmentsForEntry(entry);
        delete drafts[key];
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    } catch { /* ignore */ }
}