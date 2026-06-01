'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { DraftEntry } from '@/utils/draft-mechanism'

export interface DraftContextType {
    drafts: Record<string, DraftEntry>
    draftCount: number
    saveThreadDraft: (threadId: string, entry: DraftEntry) => void
    saveAssetDraft: (assetId: string, entry: DraftEntry) => void
    clearThreadDraft: (threadId: string, deleteAttachments?: boolean) => void
    clearAssetDraft: (assetId: string, deleteAttachments?: boolean) => void
    getThreadDraft: (threadId: string) => DraftEntry | null
    getAssetDraft: (assetId: string) => DraftEntry | null
    clearAllDrafts: () => void
    refreshDrafts: () => void
}

export const DraftContext = createContext<DraftContextType>({
    drafts: {},
    draftCount: 0,
    saveThreadDraft: () => { },
    saveAssetDraft: () => { },
    clearThreadDraft: () => { },
    clearAssetDraft: () => { },
    getThreadDraft: () => null,
    getAssetDraft: () => null,
    clearAllDrafts: () => { },
    refreshDrafts: () => { }

})
